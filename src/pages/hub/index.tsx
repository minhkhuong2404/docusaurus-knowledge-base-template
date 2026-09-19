import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { FIFTY_PRACTICAL_TIPS, PracticalTip } from '../../data/hubFiftyTipsData';
import { INTERVIEW_QUESTIONS, InterviewQuestion } from '../../data/hubInterviewQuestionsData';
import { KNOWLEDGE_MODULES, KnowledgeModule, LessonTopic } from '../../data/hubKnowledgeModulesData';

// ==========================================
// 2. DATA: CV & JOB HUNTING STRATEGY
// ==========================================

interface CvSectionBreakdown {
  sectionTitle: string;
  doThis: string[];
  dontDoThis: string[];
  exampleText: string;
}

const CV_SECTIONS: CvSectionBreakdown[] = [
  {
    sectionTitle: '1. Mô Tả Dự Án Cá Nhân (Project Experience)',
    doThis: [
      'Áp dụng công thức Google XYZ: Đạt được [X], đo lường bằng [Y], bằng cách làm [Z].',
      'Đính kèm đường dẫn GitHub repo có commit đều đặn và tài liệu Swagger/Postman API rõ ràng.',
      'Nêu rõ các thách thức kỹ thuật bạn đã trực tiếp giải quyết (N+1 query, JWT security, Redis cache).'
    ],
    dontDoThis: [
      'Ghi dự án Todo App, Quản lý sinh viên console đơn giản sao chép trên mạng.',
      'Chỉ liệt kê công nghệ dạng danh sách: "Java, Spring, MySQL" mà không nói dùng để làm gì.',
      'Viết chung chung: "Làm chức năng đăng nhập và thanh toán".'
    ],
    exampleText: '✅ "Xây dựng hệ thống E-commerce Backend phục vụ 500+ SKU; thiết kế RESTful API chuẩn RFC 7807; tối ưu hóa thời gian phản hồi API danh sách đơn hàng giảm 60% (từ 700ms xuống 280ms) bằng cách xử lý N+1 Query với JOIN FETCH và thiết lập B-Tree Index trên PostgreSQL; viết 25+ Unit & Integration Tests đạt 82% Code Coverage."'
  },
  {
    sectionTitle: '2. Kỹ Năng Kỹ Thuật (Technical Skills)',
    doThis: [
      'Phân nhóm chuyên nghiệp: Languages (Java 17/21, SQL), Frameworks (Spring Boot 3, Spring Data JPA), Tools (Docker, Git, Maven, Postman), Testing (JUnit 5, Mockito).',
      'Chỉ ghi những công nghệ bạn thực sự hiểu bản chất và có thể trả lời khi bị phỏng vấn đào sâu.'
    ],
    dontDoThis: [
      'Vẽ thanh phần trăm (%): "Java 85%, Spring 70%" (Hoàn toàn vô nghĩa và bị trừ điểm).',
      'Nhồi nhét từ khóa đao to búa lớn (Kafka, Kubernetes, Microservices, CI/CD) khi chỉ mới đọc lướt qua lý thuyết.'
    ],
    exampleText: '✅ Languages: Java (17/21), SQL (PostgreSQL, MySQL)\nFrameworks & Libraries: Spring Boot 3, Spring Data JPA, Spring Security (JWT), Hibernate, Lombok\nTesting: JUnit 5, Mockito, MockMvc\nDevOps & Tools: Docker, Docker Compose, Git, Maven, Postman, IntelliJ IDEA'
  }
];

interface CodeBattle {
  id: string;
  title: string;
  category: string;
  impactBadge: string;
  badTitle: string;
  badCode: string;
  badExplanation: string;
  goodTitle: string;
  goodCode: string;
  goodExplanation: string;
}

const CODE_BATTLES: CodeBattle[] = [
  {
    id: 'bouncer-pattern',
    title: '1. Bouncer Pattern (Guard Clauses)',
    category: 'Clean Code',
    impactBadge: 'Dễ đọc & Giảm 80% độ phức tạp',
    badTitle: '❌ Thói quen ở trường (Pyramid of Doom - Tháp if-else lồng nhau)',
    badCode: `public void processOrder(OrderRequest req) {
    if (req != null) {
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            User user = userRepo.findById(req.getUserId()).orElse(null);
            if (user != null) {
                if (user.isActive()) {
                    if (inventoryService.checkStock(req.getItems())) {
                        // Logic nghiệp vụ chính bị thụt lề 5-6 tầng!
                        paymentService.charge(user, req.getTotal());
                        orderRepo.save(new Order(user, req));
                    }
                }
            }
        }
    }
}`,
    badExplanation: 'Anti-pattern Kim tự tháp: Logic cốt lõi bị giấu sâu trong nhiều lớp ngoặc nhọn. Khi cần thêm logic kiểm tra mới, code sẽ phình to sang bên phải, cực kỳ dễ sót bug và khó viết unit test.',
    goodTitle: '✅ Chuẩn đi làm (Bouncer Pattern / Fail-Fast Guard Clauses)',
    goodCode: `public void processOrder(OrderRequest req) {
    // 1. Chặn ngay các trường hợp sai lệch ở cổng (Bouncers)
    if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
        throw new InvalidRequestException("Đơn hàng rỗng hoặc không hợp lệ");
    }
    User user = userRepo.findById(req.getUserId())
        .orElseThrow(() => new ResourceNotFoundException("User không tồn tại"));

    if (!user.isActive()) {
        throw new UserSuspendedException("Tài khoản đã bị tạm khóa");
    }
    if (!inventoryService.checkStock(req.getItems())) {
        throw new OutOfStockException("Sản phẩm đã hết hàng trong kho");
    }

    // 2. Happy Path (luồng thành công) nằm phẳng 100% ở ngoài cùng!
    paymentService.charge(user, req.getTotal());
    orderRepo.save(new Order(user, req));
}`,
    goodExplanation: 'Bouncer Pattern kiểm tra điều kiện lỗi và return hoặc ném exception ngay ở đầu method. Toàn bộ logic chính nằm phẳng phiu ở ngoài cùng, trực quan và dễ đọc như một bản danh sách việc cần làm.'
  },
  {
    id: 'constructor-vs-field',
    title: '2. Constructor Injection vs Field Injection',
    category: 'Spring Boot',
    impactBadge: 'Bất biến & Dễ viết Unit Test',
    badTitle: '❌ Thói quen ở trường (@Autowired trực tiếp lên Field)',
    badCode: `@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepo; // Field Injection

    @Autowired
    private PaymentService paymentService;

    // Khi viết Unit Test: BẮT BUỘC phải bật Spring Context nặng nề
    // hoặc dùng ReflectionTestUtils để gán giá trị!
}`,
    badExplanation: 'Field Injection phá vỡ tính đóng gói của OOP, không thể khai báo biến final (mất tính bất biến), và khiến việc viết Unit Test thuần túy bằng new OrderService(mockRepo) trở nên bất khả thi.',
    goodTitle: '✅ Chuẩn đi làm (Constructor Injection + Lombok)',
    goodCode: `@Service
@RequiredArgsConstructor // Lombok tự sinh constructor cho tất cả các field final
public class OrderService {
    private final OrderRepository orderRepo;     // Bất biến, an toàn tuyệt đối
    private final PaymentService paymentService;

    // Khi viết Unit Test: Chỉ cần new thuần túy trong 1 mili-giây:
    // OrderService service = new OrderService(mockRepo, mockPayment);
}`,
    goodExplanation: 'Constructor Injection đảm bảo dependency không thể bị null sau khi khởi tạo, cho phép đánh dấu final, và phát hiện lỗi phụ thuộc vòng (Circular Dependency) ngay khi ứng dụng khởi động (Fail-fast).'
  },
  {
    id: 'n-plus-1-join-fetch',
    title: '3. N+1 Query vs JOIN FETCH',
    category: 'Database / JPA',
    impactBadge: 'Tăng tốc API gấp 10-50 lần',
    badTitle: '❌ Thói quen ở trường (1 Query lấy Cha + N Queries lấy Con)',
    badCode: `// Sinh ra: 1 SELECT bảng User + 100 SELECT bảng Order riêng biệt!
List<User> users = userRepository.findAll();
for (User user : users) {
    // Mỗi lần gọi getOrders() là 1 lần gửi query SQL mới xuống DB
    System.out.println(user.getName() + ": " + user.getOrders().size());
}`,
    badExplanation: 'Với 1,000 user, hệ thống bắn 1,001 câu truy vấn xuống Database, chiếm dụng toàn bộ connection pool của HikariCP và khiến API mất hàng giây phản hồi.',
    goodTitle: '✅ Chuẩn đi làm (JOIN FETCH gom trong 1 câu SQL)',
    goodCode: `public interface UserRepository extends JpaRepository<User, Long> {
    // Đúng 1 câu query SQL duy nhất với LEFT JOIN
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders")
    List<User> findAllWithOrders();
}

// Service sử dụng mượt mà, không sinh thêm bất kỳ câu SQL nào:
List<User> users = userRepository.findAllWithOrders();
for (User user : users) {
    System.out.println(user.getName() + ": " + user.getOrders().size());
}`,
    goodExplanation: 'JOIN FETCH chỉ thị cho Hibernate nạp sẵn toàn bộ danh sách con ngay trong câu query ban đầu. Số lượng round-trip mạng tới DB giảm từ N+1 xuống đúng 1 lần duy nhất.'
  },
  {
    id: 'dto-vs-entity',
    title: '4. DTO Response vs Lộ Hibernate Entity',
    category: 'RESTful API',
    impactBadge: 'Bảo mật dữ liệu & Tránh vòng lặp JSON',
    badTitle: '❌ Thói quen ở trường (Trả trực tiếp Entity ra Controller)',
    badCode: `@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // Trả thẳng Entity ra JSON: Lộ password_hash, token, secret!
        // Dễ bị lỗi lặp vô tận: JsonMappingException (Lazy Loading circular ref)
        return userRepository.findById(id).orElseThrow();
    }
}`,
    badExplanation: 'Lộ cấu trúc bảng cơ sở dữ liệu nội bộ ra ngoài thế giới. Khách hàng hoặc hacker có thể nhìn thấy các cột nhạy cảm như hashed password, salt, và lịch sử xóa mềm.',
    goodTitle: '✅ Chuẩn đi làm (Tách biệt DTO Request / Response)',
    goodCode: `// DTO bất biến, chỉ chứa dữ liệu cần hiển thị cho Client
public record UserResponseDto(
    Long id,
    String fullName,
    String email,
    Instant createdAt
) {
    public static UserResponseDto from(User u) {
        return new UserResponseDto(u.getId(), u.getFullName(), u.getEmail(), u.getCreatedAt());
    }
}

@GetMapping("/{id}")
public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
    return ResponseEntity.ok(userService.getUserResponse(id));
}`,
    goodExplanation: 'Record DTO (Java 16+) giúp bảo vệ cấu trúc Database, ngăn chặn tấn công Over-Posting / Mass Assignment, và loại bỏ hoàn toàn lỗi tuần tự hóa JSON của Hibernate.'
  },
  {
    id: 'slf4j-vs-sout',
    title: '5. SLF4J Parameterized Logging vs System.out',
    category: 'Logging & Ops',
    impactBadge: 'Non-blocking I/O & Có Trace Context',
    badTitle: '❌ Thói quen ở trường (System.out.println & printStackTrace)',
    badCode: `try {
    paymentService.charge(order);
} catch (Exception e) {
    System.out.println("Lỗi thanh toán: " + e.getMessage());
    e.printStackTrace(); // Gây nghẽn luồng I/O console, mất log khi deploy Docker!
}`,
    badExplanation: 'System.out.println là hàm đồng bộ (Synchronous I/O) có khóa luồng (synchronized). Khi hệ thống có tải cao, các thread phải xếp hàng chờ ghi console, làm tê liệt hiệu năng.',
    goodTitle: '✅ Chuẩn đi làm (SLF4J + Parameterized Placeholders)',
    goodCode: `@Slf4j
@Service
public class OrderService {
    public void processPayment(Order order) {
        try {
            paymentService.charge(order);
            log.info("Thanh toán thành công | orderId={} | amount={}", order.getId(), order.getTotal());
        } catch (PaymentException ex) {
            log.error("Thanh toán thất bại | orderId={} | errorCode={}", order.getId(), ex.getErrorCode(), ex);
            throw ex;
        }
    }
}`,
    goodExplanation: 'SLF4J dùng cú pháp {} giúp JVM không phải tốn bộ nhớ nối chuỗi String nếu log level chưa được bật. Log được ghi bất đồng bộ (Async Appender) sang file có phân cấp rolling và traceId.'
  },
  {
    id: 'global-exception-vs-null',
    title: '6. @RestControllerAdvice vs Nuốt lỗi / Trả null',
    category: 'Clean Code',
    impactBadge: 'Chuẩn hóa RFC 7807 & Xóa sổ NullPointer',
    badTitle: '❌ Thói quen ở trường (Nuốt ngoại lệ hoặc return null/string linh tinh)',
    badCode: `@GetMapping("/user/{id}")
public Map<String, Object> getUser(@PathVariable Long id) {
    Map<String, Object> res = new HashMap<>();
    try {
        User u = userService.findById(id);
        res.put("data", u);
    } catch (Exception e) {
        // Nuốt lỗi hoặc trả HTTP 200 kèm cờ error!
        res.put("error", "Đã có lỗi xảy ra");
    }
    return res;
}`,
    badExplanation: 'Nuốt ngoại lệ khiến hệ thống không biết chuyện gì thực sự xảy ra. Trả mã 200 OK cho trường hợp lỗi khiến API Gateway và Frontend không thể bắt sự kiện chuẩn xác.',
    goodTitle: '✅ Chuẩn đi làm (Custom Exception + RFC 7807 Problem Detail)',
    goodCode: `// 1. Ném Custom Business Exception khi có lỗi
if (user == null) {
    throw new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id);
}

// 2. Bắt tập trung tại Global Exception Handler:
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("errorCode", "USER_NOT_FOUND");
        return problem; // Trả đúng HTTP 404 chuẩn quốc tế
    }
}`,
    goodExplanation: 'Sử dụng @RestControllerAdvice giúp tách rời 100% logic xử lý lỗi ra khỏi Service/Controller. Mã nguồn nghiệp vụ sạch bóng các khối try-catch rườm rà.'
  },
  {
    id: 'batch-insert-vs-loop',
    title: '7. Batch Insert (saveAll) vs Vòng lặp save() từng dòng',
    category: 'Database / JPA',
    impactBadge: 'Tiết kiệm 95% thời gian ghi Database',
    badTitle: '❌ Thói quen ở trường (Gọi save() trong vòng lặp for)',
    badCode: `// Có danh sách 5,000 sản phẩm mới:
for (Product p : products) {
    // MỖI VÒNG LẶP LÀ 1 LẦN MỞ TRANSACTION & 1 LẦN GỬI NETWORK!
    productRepository.save(p);
}`,
    badExplanation: '5,000 lần gọi save() đồng nghĩa với 5,000 round-trip mạng tới Database server. Thao tác này có thể tốn từ 20 đến 40 giây và làm nghẽn toàn bộ kết nối DB.',
    goodTitle: '✅ Chuẩn đi làm (Hibernate Batching + rewriteBatchedStatements)',
    goodCode: `// 1. Cấu hình application.yml:
// spring.jpa.properties.hibernate.jdbc.batch_size: 50
// spring.datasource.url: jdbc:mysql://...?rewriteBatchedStatements=true

// 2. Gửi nguyên danh sách một lần:
productRepository.saveAll(products);

// Database sẽ nhận các gói gom 50 dòng trong đúng 1 lệnh INSERT duy nhất:
// INSERT INTO products (name, price) VALUES (...), (...), (...);`,
    goodExplanation: 'Hibernate Batching kết hợp cấu hình JDBC rewrite gom hàng chục câu lệnh INSERT thành một gói tin mạng duy nhất, rút ngắn thời gian từ 30 giây xuống dưới 1 giây!'
  },
  {
    id: 'optional-orelseget-trap',
    title: '8. Optional.orElseGet() (Lazy) vs Optional.orElse() (Eager Trap)',
    category: 'Core Java',
    impactBadge: 'Tránh thực thi thừa thao tác nặng / tốn phí',
    badTitle: '❌ Thói quen ở trường (Dùng orElse với phương thức tốn kém)',
    badCode: `User user = userRepository.findByEmail(email)
    .orElse(authServiceClient.createNewRemoteUser(email)); // BẪY NGUY HIỂM!
    
// Dù user ĐÃ TỒN TẠI trong Database, hàm createNewRemoteUser(email)
// VẪN BỊ GỌI VÀ THỰC THI NGAY LẬP TỨC (Eager Evaluation)!`,
    badExplanation: 'Trong Java, tham số truyền vào hàm orElse(...) luôn bị tính toán ngay khi dòng code chạy qua. Nếu bên trong là lệnh gọi API bên ngoài, gửi email hoặc ghi DB, nó sẽ kích hoạt ngoài ý muốn!',
    goodTitle: '✅ Chuẩn đi làm (Dùng orElseGet với Lambda Supplier)',
    goodCode: `User user = userRepository.findByEmail(email)
    .orElseGet(() => authServiceClient.createNewRemoteUser(email));

// orElseGet nhận một Supplier (Functional Interface).
// Chỉ khi nào Optional rỗng (Empty) thì hàm Lambda mới được thực thi (Lazy)!`,
    goodExplanation: 'orElseGet() áp dụng cơ chế Lazy Evaluation. Nếu giá trị đã có sẵn, Lambda tuyệt đối không được gọi, tiết kiệm tối đa CPU, RAM và tránh các tác dụng phụ (side effects) tai hại.'
  },
  {
    id: 'cron-polling-vs-delayed-queue',
    title: '9. Cron Polling Quét DB vs Delayed Queue (RabbitMQ DLX / Redis ZSET)',
    category: 'System Design',
    impactBadge: 'Giảm 99% tải Database & Zero Polling CPU',
    badTitle: '❌ Thói quen ở trường (Dùng @Scheduled Cron Job SELECT full table)',
    badCode: `@Scheduled(fixedRate = 60000)
public void cancelExpiredOrders() {
    // ❌ THẢM HỌA: Bảng orders có 5 triệu dòng, quét mỗi phút một lần!
    // Gây Slow Query, khóa bảng và tranh chấp CPU nghiêm trọng với giao dịch của khách!
    List<Order> expired = orderRepo.findAllPendingOlderThan(15);
    expired.forEach(order -> {
        order.setStatus("CANCELLED");
        inventoryService.restore(order.getProductId(), order.getQty());
    });
}`,
    badExplanation: 'Cron Job định kỳ quét toàn bảng gây Full Table Scan, tải I/O đột biến mỗi phút, độ trễ xử lý không theo thời gian thực và dễ bị chạy trùng lặp khi ứng dụng mở rộng nhiều Pod.',
    goodTitle: '✅ Chuẩn đi làm (RabbitMQ DLX Message TTL hoặc Redis ZSET)',
    goodCode: `// Khi tạo đơn: Bắn message có TTL 15 phút vào queue không có listener:
rabbitTemplate.convertAndSend("order.delay.queue", orderId, m -> {
    m.getMessageProperties().setExpiration("900000"); // Đúng 15 phút
    return m;
});

// Message hết hạn tự động rơi sang Dead Letter Exchange (DLX) và chuyển tới Worker:
@RabbitListener(queues = "order.cancel.process.queue")
public void handleAutoCancel(Long orderId) {
    // Xử lý tức thì với độ trễ 0 giây, hoàn toàn không cần quét DB!
    orderService.cancelIfStillPending(orderId);
}`,
    goodExplanation: 'Mô hình Delayed Queue qua RabbitMQ DLX đạt Zero CPU Polling, chính xác từng giây, phân tán tải đều đặn và hoàn toàn độc lập với quy mô của bảng Database.'
  },
  {
    id: 'adjacency-list-vs-mptt',
    title: '10. Adjacency List (parent_id) vs MPTT Tree (left / right) Cây Bình Luận',
    category: 'Thuật Toán & DB',
    impactBadge: 'Từ N+1 câu query đệ quy về 1 câu SQL duy nhất',
    badTitle: '❌ Thói quen ở trường (Dùng parent_id và đệ quy trong Java / CTE)',
    badCode: `public CommentNode buildCommentTree(Long commentId) {
    Comment root = commentRepo.findById(commentId).orElseThrow();
    // ❌ N+1 QUERY: Mỗi node con lại phát sinh thêm một câu SELECT đệ quy!
    List<Comment> children = commentRepo.findByParentId(commentId);
    List<CommentNode> childNodes = children.stream()
            .map(c -> buildCommentTree(c.getId())) // Đệ quy sâu làm nát DB!
            .toList();
    return new CommentNode(root, childNodes);
}`,
    badExplanation: 'Mô hình Adjacency List bắt buộc server phải gọi nhiều câu truy vấn đệ quy (N+1 Query) hoặc dùng Recursive CTE nặng nề, khiến việc nạp cây bình luận sâu làm sập Database.',
    goodTitle: '✅ Chuẩn đi làm (Modified Preorder Tree Traversal - MPTT)',
    goodCode: `// ✅ 1 CÂU SELECT DUY NHẤT LẤY SẠCH TOÀN BỘ CÂY CON BÌNH LUẬN:
@Query("""
    SELECT c FROM Comment c 
    WHERE c.postId = :postId 
      AND c.commentLeft > :parentLeft 
      AND c.commentRight < :parentRight 
    ORDER BY c.commentLeft ASC
""")
List<Comment> getEntireCommentSubtree(Long postId, int parentLeft, int parentRight);`,
    goodExplanation: 'MPTT (Nested Sets Model) gán chỉ số left/right theo thứ tự duyệt cây, cho phép lấy toàn bộ cây con cháu ở mọi độ sâu chỉ bằng 1 câu SELECT duy nhất O(1) query.'
  },
  {
    id: 'random-locking-vs-consistent-ordering',
    title: '11. Khóa Tài Khoản Ngẫu Nhiên vs Consistent Lock Ordering Chuyển Tiền Banking',
    category: 'Concurrency',
    impactBadge: 'Triệt tiêu 100% nguy cơ Deadlock',
    badTitle: '❌ Thói quen ở trường (Khóa ngẫu nhiên theo thứ tự From -> To)',
    badCode: `@Transactional
public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
    // ❌ NGUY CƠ DEADLOCK:
    // Luồng 1: Chuyển 10 -> 20 (Lock 10, chờ Lock 20)
    // Luồng 2: Chuyển 20 -> 10 (Lock 20, chờ Lock 10)
    // Hai luồng chờ chéo nhau -> DEADLOCK!
    Account from = accountRepo.findByIdForUpdate(fromId);
    Account to = accountRepo.findByIdForUpdate(toId);
    from.debit(amount);
    to.credit(amount);
}`,
    badExplanation: 'Khóa tài nguyên theo thứ tự tham số đầu vào vi phạm nguyên tắc Coffman, tạo ra vòng lặp chờ Circular Wait giữa các giao dịch đối kháng.',
    goodTitle: '✅ Chuẩn đi làm (Consistent Lock Ordering: Khóa min(from, to) trước)',
    goodCode: `@Transactional
public void transferMoneySafe(Long fromId, Long toId, BigDecimal amount) {
    // ✅ BẺ GÃY HOÀN TOÀN CIRCULAR WAIT:
    Long firstId = Math.min(fromId, toId);
    Long secondId = Math.max(fromId, toId);

    // Luôn khóa ID nhỏ trước, ID lớn sau trên toàn bộ hệ thống:
    Account lock1 = accountRepo.findByIdForUpdate(firstId);
    Account lock2 = accountRepo.findByIdForUpdate(secondId);

    Account from = fromId.equals(firstId) ? lock1 : lock2;
    Account to = toId.equals(firstId) ? lock1 : lock2;
    from.debit(amount);
    to.credit(amount);
}`,
    goodExplanation: 'Consistent Lock Ordering đảm bảo mọi giao dịch đều xin khóa tài nguyên theo cùng một thứ tự toàn cục (Global Strict Ordering), loại bỏ hoàn toàn khả năng xảy ra Deadlock.'
  },
  {
    id: 'db-direct-update-vs-redis-lua-flashsale',
    title: '12. Trực Tiếp UPDATE Kho Hàng DB vs Redis Lua Script Atomic Deduction Flash Sale',
    category: 'High Concurrency',
    impactBadge: 'Chịu tải 100,000 req/s không bao giờ bị âm kho',
    badTitle: '❌ Thói quen ở trường (Đọc DB -> if -> UPDATE trực tiếp MySQL)',
    badCode: `@Transactional
public void buyFlashSaleItem(Long productId, int quantity) {
    // ❌ SẬP DB KHI CHỊU 50,000 req/s:
    // Hàng ngàn thread cùng tranh chấp Row Lock trên 1 dòng sản phẩm!
    Product p = productRepo.findById(productId).orElseThrow();
    if (p.getStock() >= quantity) {
        p.setStock(p.getStock() - quantity);
        productRepo.save(p);
    }
}`,
    badExplanation: 'Hàng ngàn kết nối cùng tranh chấp khóa hàng (Row Exclusive Lock) trên MySQL gây nghẽn Connection Pool và crash Database trong vài giây.',
    goodTitle: '✅ Chuẩn đi làm (Trừ kho nguyên tử trên RAM bằng Redis Lua Script)',
    goodCode: `// Script Lua chạy nguyên tử trên Single-Thread RAM của Redis:
String LUA_SCRIPT = """
    local stock = tonumber(redis.call('get', KEYS[1]) or 0)
    local qty = tonumber(ARGV[1])
    if stock >= qty then
        redis.call('decrby', KEYS[1], qty)
        return 1 -- Trừ kho thành công
    else
        return 0 -- Hết hàng
    end
""";
// Trừ kho cực nhanh 0.5ms không lock DB, sau đó đẩy event vào Kafka để lưu đơn async:
Long result = redisTemplate.execute(script, List.of("stock:" + productId), String.valueOf(quantity));
if (result == 1) kafkaTemplate.send("orders", new OrderEvent(userId, productId, quantity));`,
    goodExplanation: 'Đưa việc khấu trừ tồn kho lên RAM với Redis Lua Script giúp xử lý hàng trăm ngàn request mỗi giây mà không chạm vào Database, kết hợp Kafka đệm tải bền vững.'
  },
  {
    id: 'deferred-join-vs-limit-offset',
    title: '13. LIMIT OFFSET Truyền Thống vs Deferred Join Phân Trang 10 Triệu Dòng',
    category: 'Database Optimization',
    impactBadge: 'Tăng tốc từ 7.5 giây xuống 0.25 giây (gấp 30 lần)',
    badTitle: '❌ Thói quen ở trường (Dùng LIMIT 1000000, 20 trực tiếp)',
    badCode: `// ❌ CỰC KỲ CHẬM (Mất 7 - 10 giây):
// MySQL nạp toàn bộ 1,000,020 bản ghi từ đĩa vào RAM rồi vứt bỏ 1,000,000 bản ghi đầu:
SELECT * FROM orders 
WHERE status = 'PAID' 
ORDER BY id ASC 
LIMIT 1000000, 20;`,
    badExplanation: 'LIMIT OFFSET lớn buộc database phải đọc tuần tự hàng triệu trang dữ liệu từ ổ đĩa (Random Disk I/O) rồi vứt đi, làm nghẽn toàn bộ Buffer Pool của InnoDB.',
    goodTitle: '✅ Chuẩn đi làm (Kỹ thuật Deferred Join với Covering Index)',
    goodCode: `// ✅ NHANH GẤP 30 LẦN (Chỉ mất 0.25 giây):
// Subquery chỉ quét Index B-Tree siêu nhẹ, sau đó JOIN đọc đúng 20 dòng:
SELECT o.* FROM orders o
INNER JOIN (
    SELECT id FROM orders 
    WHERE status = 'PAID' 
    ORDER BY id ASC 
    LIMIT 1000000, 20
) sub ON o.id = sub.id;`,
    goodExplanation: 'Subquery tận dụng Covering Index trên RAM để lấy ra đúng 20 ID, sau đó phép JOIN chỉ thực hiện đúng 20 lần truy vấn điểm trên đĩa cứng.'
  },
  {
    id: 'unlink-async-vs-del-sync-bigkey',
    title: '14. Dùng DEL Xóa BigKey Đồng Bộ vs UNLINK Bất Đồng Bộ Trong Redis',
    category: 'Redis Performance',
    impactBadge: 'Loại bỏ thời gian treo đơ Single-Thread của Redis',
    badTitle: '❌ Thói quen ở trường (Dùng lệnh DEL để xóa mọi loại Key)',
    badCode: `// ❌ LÀM ĐƠ MÁY CHỦ REDIS 3 - 5 GIÂY:
// Nếu "active_users_set" chứa 1,000,000 phần tử:
// Lệnh DEL buộc luồng chính phải giải phóng 1 triệu ô nhớ RAM đồng bộ!
// Hàng ngàn client khác bị timeout và ngắt kết nối!
redisTemplate.delete("active_users_set");`,
    badExplanation: 'Redis xử lý đơn luồng. Lệnh DEL xóa BigKey khiến luồng chính bị chiếm dụng hoàn toàn để thu hồi bộ nhớ, không thể phục vụ bất kỳ lệnh nào khác.',
    goodTitle: '✅ Chuẩn đi làm (Dùng UNLINK để giải phóng bộ nhớ ngầm - Lazy Freeing)',
    goodCode: `// ✅ ZERO BLOCKING (Chỉ tốn vài micro-giây O(1)):
// UNLINK ngắt kết nối con trỏ Key khỏi Keyspace ngay lập tức,
// sau đó chuyển việc giải phóng 1 triệu ô nhớ cho Background Thread dọn dẹp:
redisTemplate.unlink("active_users_set");`,
    goodExplanation: 'UNLINK tách biệt thao tác xóa logic (nhanh tức thì trên luồng chính) và thao tác giải phóng RAM vật lý (chạy ngầm bất đồng bộ trên luồng phụ).'
  },
  {
    id: 'reentrantlock-vs-synchronized-virtual-threads',
    title: '15. synchronized Block (Pinning Issue) vs ReentrantLock Trong Java 21',
    category: 'Java Concurrency',
    impactBadge: 'Chống đóng băng toàn bộ Carrier Threads của CPU',
    badTitle: '❌ Thói quen ở trường (Dùng synchronized cho khối lệnh có I/O)',
    badCode: `// ❌ THẢM HỌA PINNING TRÊN JAVA 21 VIRTUAL THREADS:
public synchronized String fetchRemoteExchangeRate(String currency) {
    // Gọi HTTP mất 1 - 2 giây bên trong synchronized block:
    // Virtual Thread bị GHIM CHẶT (PINNED) vào CPU Carrier Thread!
    // 8 threads bị ghim ➔ Cả 8 CPU Cores bị tê liệt, server sập!
    return httpClient.getRate(currency);
}`,
    badExplanation: 'synchronized ghim cứng Virtual Thread vào Platform/Carrier Thread lúc I/O blocking, phá hủy hoàn toàn cơ chế unmount của Project Loom.',
    goodTitle: '✅ Chuẩn đi làm (Dùng ReentrantLock tương thích 100% Virtual Threads)',
    goodCode: `// ✅ REENTRANTLOCK AN TOÀN TUYỆT ĐỐI CHO VIRTUAL THREADS:
private final ReentrantLock lock = new ReentrantLock();

public String fetchRemoteExchangeRateSafe(String currency) {
    lock.lock();
    try {
        // Virtual Thread tự động Unmount an toàn nhường Carrier Thread cho việc khác:
        return httpClient.getRate(currency);
    } finally {
        lock.unlock();
    }
}`,
    goodExplanation: 'ReentrantLock được thiết kế lại trong Java 21 để tích hợp sâu với bộ lập lịch Virtual Thread, cho phép luồng unmount nhả CPU ngay khi gặp blocking I/O.'
  },
  {
    id: 'sticky-master-vs-random-slave-replication-lag',
    title: '16. Đọc Ngẫu Nhiên Slave Sau Khi Ghi vs Sticky Master Routing Chống Trễ Đồng Bộ',
    category: 'Architecture',
    impactBadge: 'Triệt tiêu 100% lỗi F5 vừa đăng không thấy bài',
    badTitle: '❌ Thói quen ở trường (Vừa ghi xong đọc lại ngay từ Read-Replica)',
    badCode: `// ❌ LỖI REPLICATION LAG (TRỄ SAO CHÉP 500MS):
@Transactional
public void createComment(CommentReq req) {
    commentRepo.save(new Comment(req)); // Ghi vào Master
}

@Transactional(readOnly = true)
public List<Comment> getComments(Long postId) {
    // Đọc từ Slave DB chưa kịp nhận binlog ➔ Không thấy comment vừa gửi!
    return commentRepo.findByPostId(postId);
}`,
    badExplanation: 'Read-Replica có độ trễ sao chép bất đồng bộ, người dùng vừa đăng bài nhấn F5 sẽ nhận thông báo không tìm thấy bản ghi, gây trải nghiệm cực kỳ ức chế.',
    goodTitle: '✅ Chuẩn đi làm (Sticky Master Routing với Redis Flag 5 giây)',
    goodCode: `// ✅ GÁN CỜ USER ĐỌC MASTER TRONG 5 GIÂY:
public void createCommentSafe(CommentReq req, Long userId) {
    commentRepo.save(new Comment(req));
    // Đánh dấu: Trong 5s tới, mọi request đọc của user này ưu tiên trỏ về Master:
    redisTemplate.opsForValue().set("read_master:" + userId, "1", Duration.ofSeconds(5));
}

// Dynamic DataSource kiểm tra nếu có cờ read_master thì đọc Master, không thì đọc Slave:
public DataSource determineCurrentLookupKey() {
    return isRecentlyWrittenUser() ? DataSourceType.MASTER : DataSourceType.SLAVE;
}`,
    goodExplanation: 'Sticky Master Routing chỉ định tuyến người dùng vừa thực hiện hành vi ghi đọc từ Master trong vài giây ngắn ngủi, vừa bảo đảm tính nhất quán tức thì vừa không làm quá tải Master.'
  }
];


// ==========================================
// 3. DOCUMENTATION FORMATTER HELPERS
// ==========================================

function parseInlineMarkdown(text: string, accentColor: string = '#38bdf8'): (string | React.JSX.Element)[] {
  const parts: (string | React.JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={`b-${match.index}`} style={{ color: '#ffffff', fontWeight: 700 }}>
          {boldText}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={`c-${match.index}`}
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.88em',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}
        >
          {codeText}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }
  return parts;
}

function FormattedDocContent({ text, accentColor }: { text: string; accentColor: string }): React.JSX.Element {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-blk-${i}`} style={{
            margin: '14px 0 18px 0',
            background: '#090d16',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.05em'
            }}>
              <span>{codeLang.toUpperCase() || 'SNIPPET'}</span>
            </div>
            <pre style={{ margin: 0, padding: '14px 16px', fontSize: '13.5px', background: 'transparent', color: '#e2e8f0', lineHeight: 1.55, overflowX: 'auto' }}>
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().replace('```', '');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} style={{ height: '8px' }} />);
      continue;
    }

    // Numbered item: e.g. "1. **Title:** text" or "1. **Title**"
    const numberedMatch = trimmed.match(/^([0-9]+)\.\s*\*\*(.*?)\*\*(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const heading = numberedMatch[2];
      const rest = numberedMatch[3];
      elements.push(
        <div key={`num-${i}`} style={{
          marginTop: '16px',
          marginBottom: '10px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.025)',
          borderLeft: `4px solid ${accentColor}`,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: rest && rest.trim() ? '6px' : '0' }}>
            <span style={{
              background: accentColor,
              color: '#000000',
              fontWeight: 900,
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {num}
            </span>
            <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#ffffff' }}>
              {heading}
            </span>
          </div>
          {rest && rest.trim() && (
            <div style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.65, paddingLeft: '28px' }}>
              {parseInlineMarkdown(rest.trim().replace(/^:\s*/, ''), accentColor)}
            </div>
          )}
        </div>
      );
      continue;
    }

    // Callout alert line: e.g. "⚠️ ...", "❌ ...", "👉 ...", "✅ ..."
    if (trimmed.startsWith('⚠️') || trimmed.startsWith('❌') || trimmed.startsWith('👉') || trimmed.startsWith('✅')) {
      const isWarn = trimmed.startsWith('⚠️') || trimmed.startsWith('❌');
      elements.push(
        <div key={`alert-${i}`} style={{
          margin: '12px 0',
          padding: '12px 16px',
          borderRadius: '8px',
          background: isWarn ? 'rgba(239, 68, 68, 0.08)' : 'rgba(52, 211, 153, 0.08)',
          border: `1px solid ${isWarn ? 'rgba(239, 68, 68, 0.25)' : 'rgba(52, 211, 153, 0.25)'}`,
          fontSize: '14.5px',
          color: isWarn ? '#fca5a5' : '#a7f3d0',
          lineHeight: 1.65
        }}>
          {parseInlineMarkdown(trimmed, accentColor)}
        </div>
      );
      continue;
    }

    // Bullet point: "- " or "* "
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.substring(2);
      elements.push(
        <div key={`bullet-${i}`} style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          margin: '6px 0',
          paddingLeft: '14px',
          fontSize: '14.5px',
          color: 'rgba(255, 255, 255, 0.88)',
          lineHeight: 1.65
        }}>
          <span style={{ color: accentColor, fontWeight: 900, fontSize: '14px', marginTop: '1px' }}>•</span>
          <div style={{ flex: 1 }}>{parseInlineMarkdown(bulletContent, accentColor)}</div>
        </div>
      );
      continue;
    }

    // Default paragraph
    elements.push(
      <p key={`p-${i}`} style={{
        margin: '8px 0',
        fontSize: '15px',
        color: 'rgba(255, 255, 255, 0.88)',
        lineHeight: 1.75
      }}>
        {parseInlineMarkdown(trimmed, accentColor)}
      </p>
    );
  }

  return <div>{elements}</div>;
}

// ==========================================
// 4. MAIN COMPONENT EXPORT
// ==========================================

export default function CareerHubPage(): React.JSX.Element {
  const [activeMainTab, setActiveMainTab] = useState<'lessons' | 'tips50' | 'interview' | 'battles' | 'cv' | 'probation'>('lessons');

  // Lessons state
  const [selectedModuleId, setSelectedModuleId] = useState<string>('core-java');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('stack-vs-heap');

  // 50 Tips state
  const [tipsCategoryFilter, setTipsCategoryFilter] = useState<string>('All');
  const [tipsSearchQuery, setTipsSearchQuery] = useState<string>('');
  const [expandedTipId, setExpandedTipId] = useState<number | null>(1);

  // Interview state
  const [interviewSearch, setInterviewSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('All');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>('q-1');

  // Battles state
  const [selectedBattleIndex, setSelectedBattleIndex] = useState<number>(0);

  // Snippet Copy State
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const handleCopyCode = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    }
  };

  // Probation checks (localStorage persisted)
  const [checkedProbation, setCheckedProbation] = useState<Record<string, boolean>>({
    'p-1': true,
    'p-2': true,
    'p-3': true
  });

  const filteredTips = useMemo(() => {
    return FIFTY_PRACTICAL_TIPS.filter(tip => {
      const matchCat = tipsCategoryFilter === 'All' || tip.category === tipsCategoryFilter;
      const q = tipsSearchQuery.toLowerCase();
      const matchSearch = tip.title.toLowerCase().includes(q) ||
                          tip.summary.toLowerCase().includes(q) ||
                          tip.detail.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [tipsCategoryFilter, tipsSearchQuery]);

  const filteredInterviewQuestions = useMemo(() => {
    return INTERVIEW_QUESTIONS.filter(q => {
      const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
      const matchLevel = selectedLevelFilter === 'All' || q.level === selectedLevelFilter;
      const s = interviewSearch.toLowerCase();
      const matchSearch = q.question.toLowerCase().includes(s) ||
                          q.shortAnswer.toLowerCase().includes(s) ||
                          q.seniorDeepDive.toLowerCase().includes(s) ||
                          q.trapWarning.toLowerCase().includes(s);
      return matchCat && matchLevel && matchSearch;
    });
  }, [selectedCategory, selectedLevelFilter, interviewSearch]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hub_probation_checklist_v2');
      if (saved) setCheckedProbation(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedProbation(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('hub_probation_checklist_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const PROBATION_TASKS = [
    { id: 'p-1', phase: 'Tuần 1: Onboarding', text: 'Chạy thành công dự án Local trong 48h đầu (JDK, Maven, Docker DB)', desc: 'Không cần hỏi Senior những lỗi cơ bản đã có trong README.' },
    { id: 'p-2', phase: 'Tuần 1: Onboarding', text: 'Đọc và hiểu luồng kiến trúc nghiệp vụ (Domain & Data Flow)', desc: 'Nắm được luồng request từ Gateway -> Controller -> Service -> DB.' },
    { id: 'p-3', phase: 'Tuần 1: Onboarding', text: 'Nắm vững quy tắc Git branching và commit message của team', desc: 'Quy chuẩn tên branch: feature/JIRA-123-ten-task, atomic commits.' },
    { id: 'p-4', phase: 'Tuần 1: Onboarding', text: 'Chủ động cập nhật lại file README nếu thấy tài liệu cũ bị thiếu', desc: 'Điểm cộng cực lớn giúp bạn ghi điểm chu đáo ngay từ tuần đầu.' },
    { id: 'p-5', phase: 'Tuần 1: Onboarding', text: 'Cấu hình SSH Key, GPG Signing và VPN công ty an toàn trong 24h', desc: 'Đảm bảo môi trường làm việc bảo mật, không commit bằng thông tin cá nhân sai lệch.' },
    { id: 'p-6', phase: 'Tuần 2-4: First Tasks', text: 'Mở 3 PR gần nhất của Senior để học hỏi Coding Convention', desc: 'Bắt chước cách đặt tên biến, package, xử lý exception và ghi log.' },
    { id: 'p-7', phase: 'Tuần 2-4: First Tasks', text: 'Luôn viết Unit Test đi kèm mọi dòng code mới', desc: 'Không nộp PR thiếu test; test bao phủ cả happy path và error path.' },
    { id: 'p-8', phase: 'Tuần 2-4: First Tasks', text: 'Thái độ cầu thị và lịch sự khi nhận Code Review', desc: 'Không tự ái, cảm ơn khi được góp ý và sửa triệt để trước khi ping lại.' },
    { id: 'p-9', phase: 'Tuần 2-4: First Tasks', text: 'Tự phác thảo tài liệu API Specs (OpenAPI/Swagger) trước khi code', desc: 'Trao đổi và thống nhất hợp đồng API với Frontend trước khi triển khai.' },
    { id: 'p-10', phase: 'Tuần 2-4: First Tasks', text: 'Biết cách đọc và cấu hình Application Profiler & Actuator Metrics', desc: 'Theo dõi chỉ số JVM memory, heap allocation và database query count.' },
    { id: 'p-11', phase: 'Tháng 2: Ownership', text: 'Báo cáo Daily Standup ngắn gọn: Làm gì - Sắp làm gì - Blocker', desc: 'Không nói chung chung "em đang nghiên cứu", nói rõ kết quả và rào cản.' },
    { id: 'p-12', phase: 'Tháng 2: Ownership', text: 'Estimate thời gian có vùng đệm an toàn (Buffer 1.5x)', desc: 'Dự kiến 1 ngày thì estimate 1.5 ngày để dành thời gian viết test và fix bug.' },
    { id: 'p-13', phase: 'Tháng 2: Ownership', text: 'Tự điều tra lỗi 15-30 phút trước khi nhờ Senior trợ giúp', desc: 'Áp dụng quy tắc 4 bước hỏi bài để Senior hỗ trợ nhiệt tình nhất.' },
    { id: 'p-14', phase: 'Tháng 2: Ownership', text: 'Chủ động đề xuất xóa nợ kỹ thuật (Technical Debt) cho module cũ', desc: 'Tái cấu trúc code bẩn, bổ sung unit test cho các đoạn code thiếu test.' },
    { id: 'p-15', phase: 'Tháng 2: Ownership', text: 'Tham gia quan sát và hỗ trợ Incident Response cùng các anh Senior', desc: 'Học cách đọc log phân tán, tra cứu traceId và xử lý khủng hoảng lúc deploy.' }
  ];

  const completedCount = Object.values(checkedProbation).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / PROBATION_TASKS.length) * 100);

  const activeModule = KNOWLEDGE_MODULES.find(m => m.id === selectedModuleId) || KNOWLEDGE_MODULES[0];
  const activeTopic = activeModule.topics.find(t => t.id === selectedTopicId) || activeModule.topics[0];
  const totalTopicsCount = KNOWLEDGE_MODULES.reduce((acc, m) => acc + m.topics.length, 0);

  return (
    <Layout
      title="Java Career Hub — Cẩm Nang Thực Chiến Fresher / Junior Đi Làm"
      description="Trung tâm huấn luyện kỹ năng thực chiến Backend Java từ docs cho Intern, Fresher và Junior: Tư duy bộ nhớ Stack/Heap, Spring Boot, N+1 Query, Unit Test, Bí kíp viết CV và Phỏng vấn."
    >
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #090d16 0%, #0d1117 100%)',
        padding: '32px 16px 80px 16px',
        color: '#ffffff'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

          {/* ======================================================== */}
          {/* HERO BANNER */}
          {/* ======================================================== */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              <span>🎓 DÀNH CHO INTERN • FRESHER • JUNIOR BACKEND</span>
            </div>

            <h1 style={{
              fontSize: '2.75rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
              lineHeight: 1.25
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Java Career Accelerator Hub
              </span>
            </h1>

            <p style={{
              fontSize: '1.18rem',
              color: 'rgba(255, 255, 255, 0.82)',
              maxWidth: '860px',
              margin: '0 auto 24px auto',
              lineHeight: 1.7
            }}>
              Toàn bộ kiến thức tinh hoa được cô đọng trực tiếp từ kho tài liệu kỹ thuật: <strong>Hiểu bản chất dưới nắp ca-pô</strong>, xóa bỏ thói quen code nghiệp dư ở trường và chuẩn bị hành trang vững chắc để xin việc & pass thử việc.
            </p>

            {/* Quick Metrics */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {[
                { label: `${KNOWLEDGE_MODULES.length} Khối Kiến Thức (${totalTopicsCount} Chuyên Đề)`, desc: 'Java • Spring • JPA • Test • Clean Code • Redis • Kafka • Security • Tải Cao', color: '#38bdf8' },
                { label: `${FIFTY_PRACTICAL_TIPS.length} Bí Quyết Thực Chiến`, desc: 'Quy tắc vàng sống còn khi đi làm', color: '#ec4899' },
                { label: 'Chiến Thuật Phỏng Vấn', desc: 'Bẫy phỏng vấn & Cách trả lời 10 điểm', color: '#fbbf24' },
                { label: 'Checklist 60 Ngày Thử Việc', desc: `Tiến độ: ${progressPercent}% hoàn thành`, color: '#f97316' }
              ].map((chip, i) => (
                <div key={i} style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '180px'
                }}>
                  <span style={{ color: chip.color, fontWeight: 800 }}>{chip.label}</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12.5px', marginTop: '3px' }}>{chip.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* MAIN NAVIGATION BAR */}
          {/* ======================================================== */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px'
          }}>
            {[
              { id: 'lessons', label: '📘 Kho Tri Thức Thực Chiến', color: '#38bdf8' },
              { id: 'tips50', label: `⚡ ${FIFTY_PRACTICAL_TIPS.length} Bí Quyết Đi Làm`, color: '#ec4899' },
              { id: 'interview', label: '🎯 Phỏng Vấn "Trúng Tủ"', color: '#34d399' },
              { id: 'battles', label: `⚔️ Trường Học vs Đi Làm (${CODE_BATTLES.length} Trận)`, color: '#fbbf24' },
              { id: 'cv', label: '📄 Bí Kíp Viết CV Backend', color: '#a78bfa' },
              { id: 'probation', label: `📋 Checklist Thử Việc (${progressPercent}%)`, color: '#f97316' }
            ].map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '10px',
                    background: isActive ? `${tab.color}22` : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isActive ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isActive ? tab.color : 'rgba(255, 255, 255, 0.8)',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 0 15px ${tab.color}33` : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: KHO TRI THỨC THỰC CHIẾN (DEEP LESSONS) */}
          {/* ======================================================== */}
          {activeMainTab === 'lessons' && (() => {
            const currentTopicIndex = activeModule.topics.findIndex(t => t.id === activeTopic.id);
            const prevTopic = currentTopicIndex > 0 ? activeModule.topics[currentTopicIndex - 1] : null;
            const nextTopic = currentTopicIndex < activeModule.topics.length - 1 ? activeModule.topics[currentTopicIndex + 1] : null;
            const currentModIndex = KNOWLEDGE_MODULES.findIndex(m => m.id === activeModule.id);
            const nextModule = currentModIndex < KNOWLEDGE_MODULES.length - 1 ? KNOWLEDGE_MODULES[currentModIndex + 1] : null;

            return (
              <div>
                {/* 1. Module Selector: Modern 9-Card Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {KNOWLEDGE_MODULES.map((mod, idx) => {
                    const isSelected = selectedModuleId === mod.id;
                    const modNum = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setSelectedTopicId(mod.topics[0].id);
                        }}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: isSelected
                            ? `linear-gradient(135deg, ${mod.accentColor}22 0%, rgba(255, 255, 255, 0.03) 100%)`
                            : 'rgba(255, 255, 255, 0.025)',
                          border: `1.5px solid ${isSelected ? mod.accentColor : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isSelected ? `0 0 20px ${mod.accentColor}30` : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${mod.accentColor}, transparent)`
                          }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '24px' }}>{mod.icon}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isSelected ? mod.accentColor : 'rgba(255, 255, 255, 0.07)',
                            color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.65)'
                          }}>
                            #{modNum} • {mod.topics.length} bài
                          </span>
                        </div>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                          lineHeight: 1.35,
                          marginBottom: '4px'
                        }}>
                          {mod.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: isSelected ? mod.accentColor : 'rgba(255, 255, 255, 0.5)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {mod.tagline}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Active Module Hero Strip */}
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  border: `1px solid ${activeModule.accentColor}35`,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '28px',
                      background: `${activeModule.accentColor}22`,
                      padding: '8px',
                      borderRadius: '10px',
                      display: 'inline-flex'
                    }}>
                      {activeModule.icon}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                          {activeModule.title}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: `${activeModule.accentColor}25`,
                          color: activeModule.accentColor
                        }}>
                          MODULE #{String(currentModIndex + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
                        {activeModule.tagline}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    <span>Đang xem bài: <strong style={{ color: activeModule.accentColor }}>{currentTopicIndex + 1}</strong> / {activeModule.topics.length}</span>
                    <div style={{
                      width: '80px',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((currentTopicIndex + 1) / activeModule.topics.length) * 100}%`,
                        height: '100%',
                        background: activeModule.accentColor,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* 3. Split Layout: Left Topic Index vs Right Deep-Dive Reader */}
                <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: '20px', alignItems: 'start' }}>
                  <style>{`
                    @media (max-width: 900px) {
                      div[style*="gridTemplateColumns: 310px 1fr"] {
                        grid-template-columns: 1fr !important;
                      }
                    }
                  `}</style>

                  {/* Left Column: Topic Index Pills */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px',
                    position: 'sticky',
                    top: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px 12px 6px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📑 Danh Sách Chuyên Đề
                      </span>
                      <span style={{ fontSize: '11px', color: activeModule.accentColor, fontWeight: 700 }}>
                        {activeModule.topics.length} bài học
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeModule.topics.map((t, idx) => {
                        const isTopicSelected = selectedTopicId === t.id;
                        const topicNum = String(idx + 1).padStart(2, '0');
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            style={{
                              padding: '11px 13px',
                              borderRadius: '10px',
                              background: isTopicSelected
                                ? `linear-gradient(90deg, ${activeModule.accentColor}25 0%, rgba(255, 255, 255, 0.02) 100%)`
                                : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isTopicSelected ? activeModule.accentColor : 'rgba(255, 255, 255, 0.05)'}`,
                              borderLeft: isTopicSelected ? `4px solid ${activeModule.accentColor}` : undefined,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '5px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: isTopicSelected ? activeModule.accentColor : 'rgba(255, 255, 255, 0.45)'
                              }}>
                                #{topicNum}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isTopicSelected ? `${activeModule.accentColor}30` : 'rgba(255, 255, 255, 0.05)',
                                color: isTopicSelected ? activeModule.accentColor : 'rgba(255, 255, 255, 0.55)'
                              }}>
                                {t.badge}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '13.5px',
                              fontWeight: isTopicSelected ? 800 : 600,
                              color: isTopicSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                              lineHeight: 1.35
                            }}>
                              {t.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Deep-Dive Document Reader */}
                  <div style={{
                    background: 'rgba(13, 17, 23, 0.85)',
                    border: `1px solid ${activeModule.accentColor}35`,
                    borderRadius: '16px',
                    padding: '30px 32px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {/* Breadcrumbs Tag */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12.5px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '14px'
                    }}>
                      <span>Kho Tri Thức</span>
                      <span>/</span>
                      <span style={{ color: activeModule.accentColor }}>{activeModule.title}</span>
                      <span>/</span>
                      <span style={{ color: '#ffffff' }}>Bài #{String(currentTopicIndex + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Topic Header Block */}
                    <div style={{ marginBottom: '22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: activeModule.accentColor,
                          color: '#000000'
                        }}>
                          {activeTopic.badge}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'rgba(255, 255, 255, 0.75)'
                        }}>
                          ⏱️ 5 phút đọc chuyên sâu
                        </span>
                      </div>

                      <h1 style={{
                        margin: '8px 0 14px 0',
                        fontSize: '1.95rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        lineHeight: 1.3
                      }}>
                        {activeTopic.title}
                      </h1>

                      {/* TL;DR Executive Takeaway Box */}
                      <div style={{
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '20px', marginTop: '-2px' }}>⚡</span>
                        <div style={{ fontSize: '14.5px', color: '#a7f3d0', fontWeight: 600, lineHeight: 1.6 }}>
                          <strong>Tóm tắt cốt lõi:</strong> {activeTopic.summary}
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Detailed Explanation (Formatted) */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: activeModule.accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>📖</span>
                        <span>Phân Tích Bản Chất Dưới Nắp Ca-pô:</span>
                      </div>

                      <FormattedDocContent
                        text={activeTopic.explanation}
                        accentColor={activeModule.accentColor}
                      />
                    </div>

                    {/* Section 2: ASCII Architecture Diagram (If Present) */}
                    {activeTopic.asciiDiagram && (
                      <div style={{
                        marginBottom: '28px',
                        background: '#050a14',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                      }}>
                        {/* Terminal Header */}
                        <div style={{
                          padding: '10px 16px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginLeft: '6px' }}>
                              📊 SƠ ĐỒ CƠ CHẾ BỘ NHỚ / KIẾN TRÚC HỆ THỐNG
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(activeTopic.asciiDiagram || '', `diag-${activeTopic.id}`)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: copiedSnippetId === `diag-${activeTopic.id}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                              border: `1px solid ${copiedSnippetId === `diag-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                              color: copiedSnippetId === `diag-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {copiedSnippetId === `diag-${activeTopic.id}` ? '✓ Đã chép' : '📋 Copy Sơ Đồ'}
                          </button>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '18px 20px',
                          fontSize: '13px',
                          color: '#38bdf8',
                          background: 'transparent',
                          overflowX: 'auto',
                          lineHeight: 1.5,
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                        }}>
                          {activeTopic.asciiDiagram}
                        </pre>
                      </div>
                    )}

                    {/* Section 3: Side-by-Side Code Comparison */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'rgba(255, 255, 255, 0.85)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>⚔️</span>
                        <span>Đối Chiếu Thực Chiến: Nghiệp Dư vs Chuẩn Doanh Nghiệp:</span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '16px'
                      }}>
                        {/* Bad Code Box */}
                        {activeTopic.badCode && (
                          <div style={{
                            background: 'rgba(248, 113, 113, 0.03)',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            borderRadius: '12px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              padding: '10px 14px',
                              background: 'rgba(248, 113, 113, 0.12)',
                              borderBottom: '1px solid rgba(248, 113, 113, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>
                                  {activeTopic.badCodeTitle || '❌ Cách Làm Nghiệp Dư / Code Mùi'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopyCode(activeTopic.badCode || '', `bad-${activeTopic.id}`)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  background: copiedSnippetId === `bad-${activeTopic.id}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                  border: `1px solid ${copiedSnippetId === `bad-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                                  color: copiedSnippetId === `bad-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedSnippetId === `bad-${activeTopic.id}` ? '✓ Đã chép' : '📋 Copy'}
                              </button>
                            </div>
                            <pre style={{
                              margin: 0,
                              padding: '14px 16px',
                              fontSize: '13px',
                              background: 'transparent',
                              color: '#fca5a5',
                              overflowX: 'auto',
                              lineHeight: 1.55,
                              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                            }}>
                              <code>{activeTopic.badCode}</code>
                            </pre>
                          </div>
                        )}

                        {/* Good Code Box */}
                        <div style={{
                          background: 'rgba(52, 211, 153, 0.03)',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '10px 14px',
                            background: 'rgba(52, 211, 153, 0.12)',
                            borderBottom: '1px solid rgba(52, 211, 153, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                                {activeTopic.goodCodeTitle}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyCode(activeTopic.goodCode, `good-${activeTopic.id}`)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                background: copiedSnippetId === `good-${activeTopic.id}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                border: `1px solid ${copiedSnippetId === `good-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                                color: copiedSnippetId === `good-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              {copiedSnippetId === `good-${activeTopic.id}` ? '✓ Đã chép' : '📋 Copy'}
                            </button>
                          </div>
                          <pre style={{
                            margin: 0,
                            padding: '14px 16px',
                            fontSize: '13px',
                            background: 'transparent',
                            color: '#a7f3d0',
                            overflowX: 'auto',
                            lineHeight: 1.55,
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                          }}>
                            <code>{activeTopic.goodCode}</code>
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Interview Gold Tip */}
                    <div style={{
                      marginBottom: '32px',
                      padding: '18px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.04) 100%)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      boxShadow: '0 4px 20px rgba(251, 191, 36, 0.08)'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#fbbf24',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>🏆</span>
                        <span>BẪY PHỎNG VẤN & CÁCH TRẢ LỜI ĐIỂM 10:</span>
                      </div>
                      <div style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.75 }}>
                        {parseInlineMarkdown(activeTopic.interviewTip, '#fbbf24')}
                      </div>
                    </div>

                    {/* Section 5: Pagination Bottom Navigation */}
                    <div style={{
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      {prevTopic ? (
                        <button
                          onClick={() => {
                            setSelectedTopicId(prevTopic.id);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>⬅️</span>
                          <span>Bài trước: {prevTopic.title.length > 25 ? prevTopic.title.substring(0, 25) + '...' : prevTopic.title}</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {nextTopic ? (
                        <button
                          onClick={() => {
                            setSelectedTopicId(nextTopic.id);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${activeModule.accentColor} 0%, #34d399 100%)`,
                            border: 'none',
                            color: '#000000',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 15px ${activeModule.accentColor}40`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>Bài tiếp: {nextTopic.title.length > 25 ? nextTopic.title.substring(0, 25) + '...' : nextTopic.title}</span>
                          <span>➡️</span>
                        </button>
                      ) : nextModule ? (
                        <button
                          onClick={() => {
                            setSelectedModuleId(nextModule.id);
                            setSelectedTopicId(nextModule.topics[0].id);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${nextModule.accentColor} 0%, #38bdf8 100%)`,
                            border: 'none',
                            color: '#000000',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 15px ${nextModule.accentColor}40`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>Hoàn thành module! Sang {nextModule.title}</span>
                          <span>🚀</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* TAB: 50 BÍ QUYẾT ĐI LÀM THỰC CHIẾN */}
          {/* ======================================================== */}
          {activeMainTab === 'tips50' && (
            <div>
              {/* Category Filter & Search Bar */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'Core Java & JVM', 'Spring Boot & REST', 'Database & JPA', 'Testing & QA', 'Clean Code & Logging', 'Git & Tác Phong', 'Hạ Tầng & Security', 'Hệ Thống & Tải Cao'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTipsCategoryFilter(cat)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '8px',
                        background: tipsCategoryFilter === cat ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${tipsCategoryFilter === cat ? '#ec4899' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: tipsCategoryFilter === cat ? '#ec4899' : 'rgba(255, 255, 255, 0.75)',
                        fontSize: '13.5px',
                        fontWeight: tipsCategoryFilter === cat ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat === 'All' ? `Tất cả (${FIFTY_PRACTICAL_TIPS.length})` : cat}
                    </button>
                  ))}
                </div>

                <div style={{ minWidth: '280px', flex: '1 1 auto', maxWidth: '420px' }}>
                  <input
                    type="text"
                    placeholder={`Tìm nhanh trong ${FIFTY_PRACTICAL_TIPS.length} mẹo (vd: N+1, Lua, Deadlock, Idempotent, DLX)...`}
                    value={tipsSearchQuery}
                    onChange={(e) => setTipsSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Tips Stats Bar */}
              <div style={{
                marginBottom: '18px',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span>
                  Đang hiển thị <strong>{filteredTips.length}</strong> / 50 bí quyết vàng
                </span>
                <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: 600 }}>
                  ⚡ Click vào từng thẻ để xem chi tiết & code mẫu
                </span>
              </div>

              {/* Tips List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTips.map((tip) => {
                  const isExpanded = expandedTipId === tip.id;
                  const priorityColor =
                    tip.priority === 'Bắt Buộc' ? '#ef4444' :
                    tip.priority === 'Hiệu Năng' ? '#38bdf8' :
                    tip.priority === 'Kiến Trúc' ? '#a855f7' : '#10b981';

                  return (
                    <div
                      key={tip.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${isExpanded ? '#ec4899' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        boxShadow: isExpanded ? '0 4px 20px rgba(236, 72, 153, 0.15)' : 'none'
                      }}
                    >
                      {/* Header Row */}
                      <div
                        onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                        style={{
                          padding: '15px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(236, 72, 153, 0.08)' : 'transparent',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#ffffff'
                          }}>
                            {tip.id}
                          </span>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'rgba(255, 255, 255, 0.8)'
                          }}>
                            {tip.category}
                          </span>

                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: `${priorityColor}22`,
                            color: priorityColor,
                            border: `1px solid ${priorityColor}44`
                          }}>
                            {tip.priority}
                          </span>

                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                            {tip.title}
                          </span>
                        </div>

                        <span style={{ color: '#ec4899', fontSize: '20px', fontWeight: 800, flexShrink: 0 }}>
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>

                      {/* Expandable Body */}
                      {isExpanded && (
                        <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          {/* Summary Banner */}
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: 'rgba(236, 72, 153, 0.06)',
                            border: '1px solid rgba(236, 72, 153, 0.25)',
                            fontSize: '14.5px',
                            color: 'rgba(255, 255, 255, 0.95)',
                            lineHeight: 1.6,
                            marginBottom: '14px'
                          }}>
                            ⚡ <strong>Bản chất vấn đề:</strong> {tip.summary}
                          </div>

                          {/* Detail Explanation */}
                          <div style={{
                            fontSize: '15px',
                            color: 'rgba(255, 255, 255, 0.88)',
                            lineHeight: 1.75,
                            marginBottom: (tip.codeBad || tip.codeGood) ? '16px' : '0'
                          }}>
                            {tip.detail}
                          </div>

                          {/* Code Comparison (if available) */}
                          {(tip.codeBad || tip.codeGood) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                              {tip.codeBad && (
                                <div style={{
                                  background: 'rgba(248, 113, 113, 0.05)',
                                  border: '1px solid rgba(248, 113, 113, 0.25)',
                                  borderRadius: '8px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ background: 'rgba(248, 113, 113, 0.15)', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#f87171' }}>
                                    ❌ Sai lầm thường gặp
                                  </div>
                                  <pre style={{ margin: 0, padding: '12px', fontSize: '13px', background: 'transparent', color: '#fca5a5', overflowX: 'auto', lineHeight: 1.5 }}>
                                    <code>{tip.codeBad}</code>
                                  </pre>
                                </div>
                              )}

                              {tip.codeGood && (
                                <div style={{
                                  background: 'rgba(52, 211, 153, 0.05)',
                                  border: '1px solid rgba(52, 211, 153, 0.25)',
                                  borderRadius: '8px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                                    ✅ Chuẩn đi làm (Best Practice)
                                  </div>
                                  <pre style={{ margin: 0, padding: '12px', fontSize: '13px', background: 'transparent', color: '#a7f3d0', overflowX: 'auto', lineHeight: 1.5 }}>
                                    <code>{tip.codeGood}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PHỎNG VẤN TRÚNG TỦ */}
          {/* ======================================================== */}
          {activeMainTab === 'interview' && (
            <div>
              {/* Filter and Search Bar */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '22px'
              }}>
                {/* Search Bar & Stats */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      color: '#34d399',
                      fontSize: '13.5px',
                      fontWeight: 800
                    }}>
                      🎯 Đang hiển thị {filteredInterviewQuestions.length} / {INTERVIEW_QUESTIONS.length} câu hỏi
                    </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)' }}>
                      (Phân loại theo mức độ và chủ đề)
                    </span>
                  </div>

                  <div style={{ minWidth: '280px', flex: '1 1 auto', maxWidth: '420px' }}>
                    <input
                      type="text"
                      placeholder="Tìm câu hỏi, từ khóa, bẫy phỏng vấn..."
                      value={interviewSearch}
                      onChange={(e) => setInterviewSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Level Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)', marginRight: '4px' }}>
                    Cấp Độ:
                  </span>
                  {[
                    { id: 'All', label: 'Tất cả Level' },
                    { id: 'Intern', label: '🌱 Intern (Thực tập sinh)' },
                    { id: 'Fresher', label: '🚀 Fresher (Mới ra trường)' },
                    { id: 'Junior', label: '⚡ Junior (1-2 năm kn)' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => setSelectedLevelFilter(lvl.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: selectedLevelFilter === lvl.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${selectedLevelFilter === lvl.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: selectedLevelFilter === lvl.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
                        fontSize: '13px',
                        fontWeight: selectedLevelFilter === lvl.id ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>

                {/* Category Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)', marginRight: '4px' }}>
                    Chủ Đề:
                  </span>
                  {[
                    'All',
                    'Core Java',
                    'Spring Boot',
                    'Database / JPA',
                    'Concurrency & JVM',
                    'Testing & QA',
                    'Hạ Tầng & Security',
                    'Hệ Thống & Tải Cao',
                    'Kỹ Năng & Live Coding'
                  ].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: selectedCategory === cat ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${selectedCategory === cat ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: selectedCategory === cat ? '#34d399' : 'rgba(255, 255, 255, 0.75)',
                        fontSize: '13px',
                        fontWeight: selectedCategory === cat ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat === 'All' ? 'Tất cả chủ đề' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Flashcards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredInterviewQuestions.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '10px',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14.5px'
                  }}>
                    🔍 Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại. Thử chọn "Tất cả" hoặc nhập từ khóa khác!
                  </div>
                ) : (
                  filteredInterviewQuestions.map((q) => {
                    const isExpanded = expandedQuestionId === q.id;
                    const levelBadgeColor = q.level === 'Intern' ? '#34d399' :
                                           q.level === 'Fresher' ? '#38bdf8' : '#a78bfa';
                    const catBadgeColor = q.category === 'Core Java' ? '#38bdf8' :
                                         q.category === 'Spring Boot' ? '#fbbf24' :
                                         q.category === 'Database / JPA' ? '#f97316' :
                                         q.category === 'Concurrency & JVM' ? '#ec4899' :
                                         q.category === 'Testing & QA' ? '#2dd4bf' :
                                         q.category === 'Hạ Tầng & Security' ? '#eab308' : '#34d399';

                    return (
                      <div
                        key={q.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: `1px solid ${isExpanded ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          style={{
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(52, 211, 153, 0.08)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, marginRight: '16px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: '4px',
                              background: `${levelBadgeColor}20`,
                              border: `1px solid ${levelBadgeColor}50`,
                              color: levelBadgeColor,
                              textTransform: 'uppercase'
                            }}>
                              {q.level}
                            </span>

                            <span style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '4px',
                              background: `${catBadgeColor}15`,
                              border: `1px solid ${catBadgeColor}35`,
                              color: catBadgeColor
                            }}>
                              {q.category}
                            </span>

                            <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#ffffff', lineHeight: 1.45 }}>
                              {q.question}
                            </span>
                          </div>

                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isExpanded ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isExpanded ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
                            fontSize: '18px',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {isExpanded ? '−' : '+'}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🎯</span> Câu trả lời 30 giây (Elevator Pitch)
                              </div>
                              <div style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.7 }}>
                                {q.shortAnswer}
                              </div>
                            </div>

                            <div style={{
                              padding: '14px 16px',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.06)',
                              border: '1px solid rgba(56, 189, 248, 0.2)',
                              marginBottom: '12px'
                            }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🧠</span> Dưới nắp ca-pô (Senior Deep Dive)
                              </div>
                              <div style={{ fontSize: '14.5px', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.7 }}>
                                {q.seniorDeepDive}
                              </div>
                            </div>

                            <div style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              background: 'rgba(248, 113, 113, 0.08)',
                              border: '1px solid rgba(248, 113, 113, 0.25)'
                            }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>⚠️</span> Bẫy phỏng vấn viên sẽ hỏi tiếp
                              </div>
                              <div style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.6 }}>
                                {q.trapWarning}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TRƯỜNG HỌC VS ĐI LÀM (CODE BATTLES) */}
          {/* ======================================================== */}
          {activeMainTab === 'battles' && (
            <div>
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '22px',
                marginBottom: '22px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚔️</span> Trường Học vs Đi Làm: 8 Trận So Kèo Code Thực Chiến
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)' }}>
                      So sánh trực quan giữa thói quen viết code sinh viên/lý thuyết và tiêu chuẩn Production của doanh nghiệp.
                    </p>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    color: '#fbbf24',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    Trận {selectedBattleIndex + 1} / {CODE_BATTLES.length}
                  </span>
                </div>

                {/* Battle Switcher */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {CODE_BATTLES.map((battle, idx) => (
                    <button
                      key={battle.id}
                      onClick={() => setSelectedBattleIndex(idx)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '8px',
                        background: selectedBattleIndex === idx ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${selectedBattleIndex === idx ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: selectedBattleIndex === idx ? '#fbbf24' : 'rgba(255, 255, 255, 0.75)',
                        fontWeight: selectedBattleIndex === idx ? 800 : 500,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {battle.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Battle Details Header */}
              {(() => {
                const currentBattle = CODE_BATTLES[selectedBattleIndex] || CODE_BATTLES[0];
                return (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '16px',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          fontSize: '12.5px',
                          fontWeight: 800
                        }}>
                          {currentBattle.category}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                          {currentBattle.title}
                        </span>
                      </div>

                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399',
                        fontSize: '13px',
                        fontWeight: 800
                      }}>
                        ⚡ Tác động: {currentBattle.impactBadge}
                      </span>
                    </div>

                    {/* Battle Side-by-Side Showcase */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '18px' }}>
                      {/* Left: Bad Code */}
                      <div style={{
                        background: 'rgba(248, 113, 113, 0.04)',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ background: 'rgba(248, 113, 113, 0.15)', padding: '11px 16px', fontSize: '14px', fontWeight: 700, color: '#f87171' }}>
                          {currentBattle.badTitle}
                        </div>
                        <pre style={{ margin: 0, padding: '16px', fontSize: '13.5px', lineHeight: 1.6, background: 'transparent', color: '#fca5a5', overflowX: 'auto', flex: 1 }}>
                          <code>{currentBattle.badCode}</code>
                        </pre>
                        <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(248, 113, 113, 0.2)', fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.6 }}>
                          <strong style={{ color: '#f87171' }}>Hậu quả: </strong>{currentBattle.badExplanation}
                        </div>
                      </div>

                      {/* Right: Good Code */}
                      <div style={{
                        background: 'rgba(52, 211, 153, 0.04)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '11px 16px', fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                          {currentBattle.goodTitle}
                        </div>
                        <pre style={{ margin: 0, padding: '16px', fontSize: '13.5px', lineHeight: 1.6, background: 'transparent', color: '#a7f3d0', overflowX: 'auto', flex: 1 }}>
                          <code>{currentBattle.goodCode}</code>
                        </pre>
                        <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(52, 211, 153, 0.2)', fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.6 }}>
                          <strong style={{ color: '#34d399' }}>Lợi ích Production: </strong>{currentBattle.goodExplanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: BÍ KÍP VIẾT CV BACKEND */}
          {/* ======================================================== */}
          {activeMainTab === 'cv' && (
            <div>
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '26px',
                marginBottom: '22px'
              }}>
                <h2 style={{ margin: '0 0 14px 0', fontSize: '1.6rem', color: '#a78bfa' }}>
                  📄 4 Tiêu Chuẩn Vàng Viết CV Cho Fresher / Junior
                </h2>
                <p style={{ margin: '0 0 22px 0', fontSize: '15px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.75 }}>
                  Technical Recruiter và Tech Lead chỉ dành trung bình <strong>6 giây</strong> để lướt qua một chiếc CV. Dưới đây là cách biến CV của bạn thành thỏi nam châm hút lịch phỏng vấn:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {CV_SECTIONS.map((sec, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '18px'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
                        {sec.sectionTitle}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                            ✅ NÊN LÀM
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.7 }}>
                            {sec.doThis.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>

                        <div style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                            ❌ TUYỆT ĐỐI TRÁNH
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.7 }}>
                            {sec.dontDoThis.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '13.5px',
                        color: '#a7f3d0',
                        lineHeight: 1.6
                      }}>
                        {sec.exampleText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CHECKLIST 60 NGÀY THỬ VIỆC */}
          {/* ======================================================== */}
          {activeMainTab === 'probation' && (
            <div>
              {/* Progress Bar */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '22px',
                marginBottom: '22px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#ffffff' }}>
                    Tiến Độ Sẵn Sàng Vượt Qua 2 Tháng Thử Việc (Probation Survival Tracker)
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: progressPercent >= 70 ? '#34d399' : '#fbbf24' }}>
                    {completedCount} / {PROBATION_TASKS.length} ({progressPercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: progressPercent >= 70 ? 'linear-gradient(90deg, #34d399, #38bdf8)' : 'linear-gradient(90deg, #fbbf24, #f97316)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PROBATION_TASKS.map((t) => {
                  const isChecked = !!checkedProbation[t.id];
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleCheck(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isChecked ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#34d399', width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: t.phase.includes('Tuần 1') ? 'rgba(56, 189, 248, 0.2)' :
                                        t.phase.includes('Tuần 2-4') ? 'rgba(251, 191, 36, 0.2)' : 'rgba(167, 139, 250, 0.2)',
                            color: t.phase.includes('Tuần 1') ? '#38bdf8' :
                                   t.phase.includes('Tuần 2-4') ? '#fbbf24' : '#a78bfa'
                          }}>
                            {t.phase}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: isChecked ? '#a7f3d0' : '#ffffff' }}>
                            {t.text}
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.55 }}>
                          {t.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FOOTER CALLOUT BANNER */}
          {/* ======================================================== */}
          <div style={{
            marginTop: '44px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '28px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.45rem', color: '#ffffff' }}>
              Kiến thức vững vàng — Tự tin bước vào dự án thực tế
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '720px', marginInline: 'auto', lineHeight: 1.7 }}>
              Hãy đào sâu từng chủ đề, viết code mẫu và chạy thử nghiệm trên máy của bạn. Chúc bạn sớm nhận được Offer và vượt qua thử việc xuất sắc!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                to="/technical-knowledge/java/java-overview"
                style={{
                  background: '#38bdf8',
                  color: '#000000',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '14.5px',
                  textDecoration: 'none'
                }}
              >
                Khám Phá Toàn Bộ Java Docs →
              </Link>
              <Link
                to="/arcade"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  textDecoration: 'none'
                }}
              >
                Luyện Tập Tại Arcade 🕹️
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
