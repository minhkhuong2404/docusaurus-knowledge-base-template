import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { FIFTY_PRACTICAL_TIPS, PracticalTip } from '../../data/hubFiftyTipsData';
import { INTERVIEW_QUESTIONS, InterviewQuestion } from '../../data/hubInterviewQuestionsData';

// ==========================================
// 1. DATA: KHO TRI THỨC THỰC CHIẾN (DEEP LESSONS)
// ==========================================

interface LessonTopic {
  id: string;
  title: string;
  badge: string;
  summary: string;
  explanation: string;
  asciiDiagram?: string;
  badCodeTitle?: string;
  badCode?: string;
  goodCodeTitle: string;
  goodCode: string;
  interviewTip: string;
}

interface KnowledgeModule {
  id: string;
  title: string;
  icon: string;
  accentColor: string;
  tagline: string;
  topics: LessonTopic[];
}

const KNOWLEDGE_MODULES: KnowledgeModule[] = [
  {
    id: 'core-java',
    title: 'Core Java & Tư Duy Bộ Nhớ',
    icon: '☕',
    accentColor: '#38bdf8',
    tagline: 'Hiểu cội nguồn JVM, quản lý bộ nhớ và cấu trúc dữ liệu để không bao giờ bị đè bug',
    topics: [
      {
        id: 'stack-vs-heap',
        title: '1. Stack vs Heap & Cơ Chế Truyền Tham Trị (Pass-by-Value)',
        badge: 'Cực Kỳ Quan Trọng',
        summary: 'Java lưu trữ biến cục bộ và con trỏ ở Stack, còn dữ liệu thực tế của đối tượng nằm ở Heap. Java LUÔN truyền tham trị (Pass-by-value).',
        explanation: `Trong JVM, bộ nhớ chia làm 2 khu vực chính mà bạn tiếp xúc hàng ngày:
1. **Stack Memory:** Mỗi Thread có một vùng Stack riêng. Dùng để lưu trữ các biến nguyên thủy cục bộ (int, double, boolean...) và các địa chỉ con trỏ (reference) trỏ tới object. Khi hàm chạy xong, Stack Frame bị hủy ngay lập tức, cực kỳ nhanh.
2. **Heap Memory:** Vùng nhớ dùng chung cho toàn bộ ứng dụng. Tất cả các object (kể cả mảng, String, List, hay Entity) đều được cấp phát trên Heap. Vùng này do bộ gom rác (Garbage Collector - GC) quản lý dọn dẹp.

⚠️ **Lầm tưởng kinh điển của sinh viên:** "Java truyền tham chiếu (Pass-by-reference)".
Sự thật: **Java LUÔN LUÔN truyền tham trị (Pass-by-Value)**! Khi bạn truyền một object vào hàm, Java copy **giá trị của địa chỉ con trỏ** chứ không truyền bản thân con trỏ gốc. Do đó:
- Bạn có thể sửa đổi thuộc tính bên trong object: \`user.setName("Nam")\` ➔ Có tác dụng ở ngoài hàm.
- Nhưng nếu bạn gán \`user = new User("Khác")\` ➔ KHÔNG CÓ tác dụng ngoài hàm vì bạn chỉ đang thay đổi bản sao con trỏ nội bộ!`,
        asciiDiagram: `[Thread Stack]                         [Shared Heap Memory]
┌─────────────────────────┐            ┌──────────────────────────────┐
│ Frame: main()           │            │                              │
│  int age = 22;          │            │  User Object:                │
│  User u ───────────────┼───────────>│  { id: 1, name: "Khuong" }    │
└─────────────────────────┘            │                              │
┌─────────────────────────┐            │                              │
│ Frame: modify(User u2)  │            │                              │
│  User u2 (copy ref) ────┼────────────┘                              │
└─────────────────────────┘            └──────────────────────────────┘`,
        badCodeTitle: '❌ Lầm tưởng hàm swap() đổi được 2 đối tượng',
        badCode: `// Sinh viên hay viết:
public void swap(User a, User b) {
    User temp = a;
    a = b;
    b = temp;
    // Ra ngoài hàm: a và b của caller KHÔNG HỀ THAY ĐỔI!
}`,
        goodCodeTitle: '✅ Hiểu đúng bản chất truyền bản sao con trỏ',
        goodCode: `public void updateUserName(User user, String newName) {
    // Sửa thuộc tính bên trong object thành công vì trỏ cùng ô nhớ Heap
    user.setName(newName);
    
    // Gán lại tham chiếu sẽ vô nghĩa với bên ngoài:
    // user = new User("Another"); // ❌ Không ảnh hưởng caller
}`,
        interviewTip: 'Nếu phỏng vấn viên hỏi: "Java là pass-by-value hay pass-by-reference?", hãy trả lời dứt khoát: "Java 100% là pass-by-value. Đối với kiểu tham chiếu (object), giá trị được truyền đi chính là bản sao của địa chỉ ô nhớ (copy of reference address)". Bạn sẽ ghi điểm tuyệt đối!'
      },
      {
        id: 'arraylist-vs-linkedlist',
        title: '2. ArrayList vs LinkedList: Tại Sao 99% Đi Làm Dùng ArrayList?',
        badge: 'Tối Ưu Hiệu Năng',
        summary: 'Ở trường hay dạy LinkedList chèn xóa nhanh O(1), nhưng đi làm 99% ta dùng ArrayList vì CPU Cache Locality.',
        explanation: `Ở trường đại học, thầy cô thường dạy lý thuyết trên giấy:
- \`ArrayList\`: Chèn/xóa ở giữa mảng tốn $O(N)$ vì phải dồn các phần tử còn lại.
- \`LinkedList\`: Chèn/xóa ở giữa tốn $O(1)$ vì chỉ cần đổi con trỏ \`prev\` và \`next\`.

**Thực tế đau lòng khi đi làm:**
1. Để chèn vào vị trí $i$ trong \`LinkedList\`, bạn phải duyệt từ đầu danh sách đến vị trí $i$ ➔ Bản thân việc tìm kiếm đã tốn **$O(N)$** rồi!
2. **CPU Cache Locality (Bộ nhớ đệm CPU):** \`ArrayList\` lưu trữ trên mảng liên tục (contiguous memory). Khi CPU đọc phần tử thứ $0$, phần cứng CPU tự động nạp luôn cả đoạn mảng lân cận vào L1/L2 Cache, giúp việc duyệt mảng nhanh gấp hàng chục lần.
3. \`LinkedList\` lưu trữ mỗi Node phân tán rải rác khắp nơi trên Heap. Duyệt \`LinkedList\` khiến CPU liên tục bị **Cache Miss** (phải chờ nạp từ RAM rất chậm), đồng thời tốn thêm 24 byte bộ nhớ chỉ để chứa 2 con trỏ \`prev\` và \`next\` cho mỗi Node.`,
        badCodeTitle: '❌ Thói quen dùng LinkedList vì nghĩ nó nhanh hơn',
        badCode: `// Nghĩ rằng chèn nhiều thì LinkedList sẽ tối ưu hơn:
List<Transaction> list = new LinkedList<>(); 
for (int i = 0; i < 100_000; i++) {
    list.add(new Transaction(i)); // Tốn cực nhiều RAM và chậm vì GC rác Node!
}`,
        goodCodeTitle: '✅ Luôn ưu tiên ArrayList và cấp phát trước kích thước nếu biết',
        goodCode: `// Khởi tạo ArrayList với initialCapacity ước lượng trước
List<Transaction> list = new ArrayList<>(100_000);
for (int i = 0; i < 100_000; i++) {
    list.add(new Transaction(i)); // Cực nhanh, tận dụng CPU cache liên tục
}`,
        interviewTip: 'Khi được hỏi so sánh ArrayList và LinkedList, hãy nhắc đến từ khóa "CPU Cache Locality" và "Memory Contiguity". Người phỏng vấn sẽ nhận ra bạn có tư duy phần cứng và kỹ sư thực thụ chứ không phải học vẹt lý thuyết trường lớp.'
      },
      {
        id: 'hashmap-internals',
        title: '3. Bản Chất HashMap & Hợp Đồng equals() / hashCode()',
        badge: 'Cực Kỳ Hay Hỏi',
        summary: 'Hiểu cơ chế mảng bucket, giải quyết xung đột bằng Cây Đỏ-Đen và tại sao quên override hashCode() sẽ làm mất dữ liệu.',
        explanation: `HashMap hoạt động dựa trên bảng băm (Hash Table):
1. **Tính vị trí Bucket:** Khi gọi \`map.put(key, value)\`, Java lấy mã băm của key bằng hàm \`key.hashCode()\`. Sau đó dùng phép tính bit: \`index = (n - 1) & hash\` để tìm vị trí bucket trong mảng.
2. **Xung đột băm (Hash Collision):** Nếu hai key khác nhau có cùng \`index\`, chúng sẽ rơi vào cùng một bucket.
   - Java 7: Nối các phần tử thành một Danh sách liên kết đơn (LinkedList). Khi xung đột nhiều, tìm kiếm bị chậm thành $O(N)$.
   - Java 8+: Nếu số phần tử trong 1 bucket $\ge 8$ và tổng dung lượng map $\ge 64$, bucket đó tự động chuyển hóa thành **Cây Đỏ-Đen (Red-Black Tree)**, giúp thời gian tìm kiếm giảm xuống chỉ còn **$O(\log N)$**!
3. **Hợp đồng equals() & hashCode():**
   - Nếu \`a.equals(b) == true\` thì bắt buộc \`a.hashCode() == b.hashCode()\`.
   - Nếu bạn chỉ override \`equals()\` mà quên override \`hashCode()\`: Hai object có cùng nội dung sẽ sinh ra hai mã hash khác nhau. Khi đưa vào Map, object thứ hai rơi vào bucket khác, dẫn đến việc gọi \`map.get(key)\` trả về \`null\` mặc dù key đã tồn tại!`,
        badCodeTitle: '❌ Override equals() nhưng quên hashCode()',
        badCode: `public class CustomerId {
    private String id;
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CustomerId)) return false;
        return Objects.equals(id, ((CustomerId) o).id);
    }
    // ❌ QUÊN override hashCode(): HashMap.get() sẽ trả về NULL!
}`,
        goodCodeTitle: '✅ Luôn override cả hai (hoặc dùng Record trong Java 16+)',
        goodCode: `// Cách 1: Tự động sinh cả hai bằng IDE hoặc Objects.hash()
@Override
public int hashCode() {
    return Objects.hash(id);
}

// Cách 2: Dùng Java Record (tự động có equals/hashCode/toString chuẩn xác 100%)
public record CustomerId(String id) {}`,
        interviewTip: 'Luôn nhớ con số 8 và 64: Khi bucket có 8 node và map size >= 64, HashMap chuyển sang Cây Đỏ-Đen (Treeify). Khi số node giảm xuống 6, nó chuyển ngược lại LinkedList (Untreeify) để tiết kiệm bộ nhớ.'
      },
      {
        id: 'modern-java-features',
        title: '4. Java 8 Đến Java 21: Stream, Optional Đúng Cách & Records',
        badge: 'Cú Pháp Chuẩn Đi Làm',
        summary: 'Không lạm dụng Optional.get(), thay thế class DTO dài dòng bằng Record và viết code phong cách khai báo (Declarative).',
        explanation: `Đi làm hiện nay các công ty đều chạy từ Java 11, 17 đến 21. Những tính năng bạn bắt buộc phải thành thạo:
1. **Optional không phải để thay thế if(obj != null):**
   - ❌ Đừng viết: \`if (opt.isPresent()) { return opt.get(); }\` (viết thế này thì khác gì kiểm tra null thông thường?).
   - ✅ Dùng: \`opt.orElseThrow(() -> new NotFoundException())\` hoặc \`opt.map(...)\`.
   - Phân biệt: \`orElse(new Value())\` (luôn khởi tạo đối tượng dù có null hay không) vs \`orElseGet(() -> new Value())\` (chỉ khởi tạo khi thực sự null - Lazy evaluation).
2. **Records (Java 16+):** Loại bỏ hàng trăm dòng code Getter/Setter/Constructor thừa thãi của DTO. Record bất biến mặc định, an toàn đa luồng.
3. **Stream API:** Xử lý danh sách mang tính khai báo (filter, map, collect) thay cho các vòng lặp for lồng nhau phức tạp.`,
        badCodeTitle: '❌ Dùng Optional nghiệp dư và class DTO cồng kềnh',
        badCode: `// ❌ Biến Optional thành rác rối hơn cả check null:
Optional<User> userOpt = userRepo.findById(id);
if (userOpt.isPresent()) {
    User u = userOpt.get(); // Nếu quên check sẽ văng NoSuchElementException!
    return u.getName();
}
return "Default";`,
        goodCodeTitle: '✅ Dùng Optional chuẩn chỉnh & Record gọn gàng',
        goodCode: `// ✅ Khai báo DTO chỉ trong 1 dòng duy nhất:
public record UserSummaryDto(Long id, String name, String email) {}

// ✅ Xử lý Optional thanh thoát bằng Stream pipeline:
return userRepo.findById(id)
    .map(user -> new UserSummaryDto(user.getId(), user.getName(), user.getEmail()))
    .orElseThrow(() -> new UserNotFoundException(id));`,
        interviewTip: 'Hỏi về Optional: "Khi nào không nên dùng Optional?" ➔ Trả lời: Không dùng Optional làm tham số đầu vào của method, không dùng làm field trong Entity/Class và không bọc Collection vào Optional (hãy trả về List rỗng List.of() thay vì Optional<List>).'
      }
    ]
  },
  {
    id: 'spring-boot',
    title: 'Spring Boot & Kiến Trúc REST API',
    icon: '🚀',
    accentColor: '#fbbf24',
    tagline: 'Làm chủ Inversion of Control, thiết kế API chuẩn mực và không bao giờ để rò rỉ dữ liệu',
    topics: [
      {
        id: 'constructor-injection',
        title: '1. Tại Sao CẤM Dùng @Autowired Trên Field (Field Injection)?',
        badge: 'Quy Tắc Sống Còn',
        summary: 'Field Injection là nguyên nhân gây khó viết Unit Test, mất tính bất biến (Immutability) và dễ gây lỗi vòng lặp phụ thuộc ngầm.',
        explanation: `Trong các bài hướng dẫn cũ hoặc đồ án sinh viên, bạn thường thấy:
\`\`\`java
@Autowired
private OrderRepository orderRepository;
\`\`\`
Khi đi làm ở các công ty chuyên nghiệp, **Pull Request có dòng code này sẽ bị Senior từ chối merge ngay lập tức!**

**3 Lý do Field Injection bị coi là "Code Mùi" (Code Smell):**
1. **Không thể viết Unit Test thuần túy:** Biến bị đánh dấu \`private\`. Khi viết Unit Test, bạn không thể \`new OrderService()\` rồi truyền repo giả vào được mà bắt buộc phải khởi động cả Spring Context chậm chạp hoặc dùng Reflection bẩn.
2. **Không thể dùng từ khóa \`final\`:** Không có \`final\`, object không thể đảm bảo tính bất biến (Immutability), tiềm ẩn nguy cơ bị ghi đè sau khi khởi tạo.
3. **Che giấu vi phạm Single Responsibility:** Field injection nhìn rất ngắn gọn nên lập trình viên dễ dàng tiêm 10-15 dependencies vào 1 class mà không thấy "ngại". Với Constructor Injection, khi constructor có 8 tham số, bạn sẽ nhận ra class này đang quá tải và cần tách nhỏ.`,
        badCodeTitle: '❌ Field Injection thiếu an toàn',
        badCode: `@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private PaymentService paymentService;
    // Rất khó viết Unit Test, không thể dùng 'final'!
}`,
        goodCodeTitle: '✅ Constructor Injection kết hợp Lombok @RequiredArgsConstructor',
        goodCode: `@Service
@RequiredArgsConstructor // Lombok tự tạo constructor cho tất cả trường 'final'
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    // Viết Unit test siêu nhanh và nhẹ nhàng:
    // OrderService service = new OrderService(mockRepo, mockPayment);
}`,
        interviewTip: 'Nếu phỏng vấn viên hỏi: "Làm sao phát hiện lỗi Circular Dependency (A cần B, B cần A) sớm nhất?", hãy trả lời: "Khi dùng Constructor Injection, Spring sẽ ném lỗi BeanCurrentlyInCreationException ngay lúc ứng dụng khởi động (Fail-Fast), trong khi Field Injection có thể giấu lỗi đến tận khi phương thức được gọi lần đầu".'
      },
      {
        id: 'layered-architecture-dto',
        title: '2. Kiến Trúc 3 Tầng Chuẩn & Quy Tắc CẤM Lộ Entity Ra Controller',
        badge: 'Thiết Kế Hệ Thống',
        summary: 'Tách biệt ranh giới Controller - Service - Repository. Luôn dùng Request/Response DTO để bảo vệ cơ sở dữ liệu.',
        explanation: `Một ứng dụng Backend chuyên nghiệp luôn chia thành 4 lớp rõ ràng:
1. **Controller:** Cửa ngõ đón nhận HTTP Request. Chỉ làm nhiệm vụ: parse JSON, kiểm tra tính hợp lệ dữ liệu (@Valid), gọi Service và trả HTTP Response.
2. **Service:** Trái tim hệ thống. Chứa toàn bộ nghiệp vụ, logic tính toán, gọi nhiều Repository, quản lý Transaction (@Transactional).
3. **Repository:** Tầng giao tiếp cơ sở dữ liệu (Spring Data JPA).
4. **DTO (Data Transfer Object):** Đối tượng chuyên chở dữ liệu giữa Client và Server.

🚨 **Tội lỗi lớn nhất của Fresher:** Trả trực tiếp Hibernate Entity ra Controller!
- **Hậu quả 1 (Lộ dữ liệu nhạy cảm):** Entity User chứa cả cột \`password_hash\`, \`role\`, \`token\`. Khi serialize ra JSON, toàn bộ thông tin nhạy cảm này bị gửi về cho phía người dùng!
- **Hậu quả 2 (Lỗi LazyInitializationException):** Khi Jackson cố gắng serialize các quan hệ \`@OneToMany(fetch = LAZY)\`, Hibernate Session đã đóng từ tầng Service, làm nổ lỗi 500 hàng loạt.
- **Hậu quả 3 (Vòng lặp vô tận StackOverflow):** Nếu quan hệ 2 chiều (User có List<Order>, Order có User), Jackson sẽ tuần tự hóa xoay vòng A -> B -> A -> B... cho đến khi server sập vì tràn Stack!`,
        badCodeTitle: '❌ Trả Entity trực tiếp ra ngoài Controller',
        badCode: `@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    // Nguy hiểm: Lộ schema DB, dễ bị nổ LazyInitializationException!
    return orderRepository.findById(id).orElse(null);
}`,
        goodCodeTitle: '✅ Dùng DTO Response và ResponseEntity chuẩn REST',
        goodCode: `@GetMapping("/orders/{id}")
public ResponseEntity<OrderResponseDto> getOrder(@PathVariable Long id) {
    OrderResponseDto dto = orderService.getOrderById(id);
    return ResponseEntity.ok(dto);
}

// DTO chỉ chứa đúng những trường client cần xem:
public record OrderResponseDto(
    Long orderId,
    BigDecimal totalAmount,
    String status,
    List<OrderItemDto> items
) {}`,
        interviewTip: 'Khi giải thích về DTO, hãy nhấn mạnh: "DTO đóng vai trò như một lớp tường lửa phân tách API Contract (hợp đồng với client) và Database Schema (lược đồ bảng nội bộ). Khi database đổi tên cột, API client bên ngoài không hề bị ảnh hưởng".'
      },
      {
        id: 'global-exception-handling',
        title: '3. Xử Lý Lỗi Toàn Cục Bằng @RestControllerAdvice (RFC 7807)',
        badge: 'Clean Code',
        summary: 'Dẹp bỏ try-catch rải rác ở Controller. Đóng gói lỗi chuyên nghiệp trả về đúng HTTP Status code.',
        explanation: `Đừng bao giờ viết \`try-catch\` trong từng phương thức của Controller. Hãy để Exception văng ra tự nhiên và để một lớp bắt lỗi toàn cục (\`@RestControllerAdvice\`) chịu trách nhiệm đóng gói.

**Chuẩn hóa thông báo lỗi:**
- Lỗi tìm không thấy tài nguyên ➔ Trả về **404 NOT FOUND**.
- Lỗi validate dữ liệu người dùng gửi sai ➔ Trả về **400 BAD REQUEST**.
- Lỗi chưa đăng nhập ➔ Trả về **401 UNAUTHORIZED**.
- Lỗi đã đăng nhập nhưng không có quyền ➔ Trả về **403 FORBIDDEN**.
- Lỗi xung đột dữ liệu (trùng email, duplicate key) ➔ Trả về **409 CONFLICT**.
- Lỗi crash không lường trước ➔ Trả về **500 INTERNAL SERVER ERROR** kèm mã Correlation ID để tra cứu log.`,
        badCodeTitle: '❌ Try-catch thủ công và trả về mã lỗi lung tung',
        badCode: `@PostMapping("/users")
public ResponseEntity<?> createUser(@RequestBody UserDto dto) {
    try {
        userService.save(dto);
        return ResponseEntity.ok("Success");
    } catch (Exception e) {
        // Trả HTTP 200 kèm chuỗi thông báo lỗi ➔ Frontend tưởng thành công!
        return ResponseEntity.ok("Lỗi: " + e.getMessage());
    }
}`,
        goodCodeTitle: '✅ @RestControllerAdvice bắt lỗi tập trung',
        goodCode: `@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        log.warn("Không tìm thấy tài nguyên: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(f -> errors.put(f.getField(), f.getDefaultMessage()));
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation Failed");
        problem.setProperty("errors", errors);
        return problem;
    }
}`,
        interviewTip: 'Nhắc đến RFC 7807 (ProblemDetail) trong Spring Boot 3 là một "điểm cộng vàng". Nó chứng minh bạn luôn cập nhật các tiêu chuẩn API hiện đại nhất của ngành.'
      }
    ]
  },
  {
    id: 'jpa-database',
    title: 'JPA, Hibernate & Bệnh N+1 Query',
    icon: '💾',
    accentColor: '#f97316',
    tagline: 'Đặc trị lỗi hiệu năng phổ biến nhất làm sập cơ sở dữ liệu trong các dự án thực tế',
    topics: [
      {
        id: 'n-plus-one-deep-dive',
        title: '1. N+1 Query Problem: Bản Chất & 2 Phương Pháp Đặc Trị',
        badge: '90% Ứng Viên Bị Hỏi',
        summary: 'N+1 là thảm họa khi load 1 danh sách cha rồi chạy thêm N câu query con. Khắc phục bằng JOIN FETCH hoặc @EntityGraph.',
        explanation: `Giả sử bảng \`Department\` (Khoa) có quan hệ \`@OneToMany\` với \`Employee\` (Nhân viên).
Bạn muốn lấy danh sách 100 Khoa và in ra tên các Nhân viên trong từng Khoa.

**Diễn biến của thảm họa N+1:**
1. Hibernate chạy **1 câu query đầu tiên**: \`SELECT * FROM department\` (Lấy được 100 bản ghi).
2. Khi bạn duyệt vòng lặp \`for (Department d : departments)\` và gọi \`d.getEmployees()\`:
   Vì quan hệ là LAZY, Hibernate lập tức gửi thêm **1 câu query riêng biệt cho từng Khoa**:
   \`SELECT * FROM employee WHERE department_id = 1\`
   \`SELECT * FROM employee WHERE department_id = 2\`
   ...
   \`SELECT * FROM employee WHERE department_id = 100\`
3. **Tổng cộng:** $1 + 100 = 101$ câu truy vấn gửi xuống cơ sở dữ liệu trong vòng vài phần trăm giây!
Hậu quả: Hết sạch Connection Pool, CPU database vọt lên 100%, server lăn ra chết.

**2 Cách Khắc Phục Chuẩn Kỹ Sư:**
- **Cách 1 (Phổ biến nhất): Dùng \`JOIN FETCH\` trong JPQL:** Bắt Hibernate thực hiện phép \`INNER JOIN\` hoặc \`LEFT JOIN\` ngay trong câu SQL duy nhất.
- **Cách 2: Dùng \`@EntityGraph\`:** Khai báo danh sách các trường liên kết cần nạp kèm mà không cần viết lại JPQL.`,
        badCodeTitle: '❌ Lặp query trong vòng lặp (N+1 Query)',
        badCode: `// Repository mặc định:
List<Department> deps = departmentRepo.findAll(); // 1 Query
for (Department d : deps) {
    // Mỗi lần lặp là 1 Query bắn xuống DB!
    System.out.println(d.getEmployees().size());
}`,
        goodCodeTitle: '✅ Giải quyết triệt để bằng JOIN FETCH',
        goodCode: `public interface DepartmentRepository extends JpaRepository<Department, Long> {
    // 1 câu lệnh SQL duy nhất kéo toàn bộ dữ liệu Department + Employee!
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.employees")
    List<Department> findAllWithEmployees();
}

// Hoặc dùng EntityGraph:
@EntityGraph(attributePaths = {"employees"})
List<Department> findAll();`,
        interviewTip: 'Lưu ý khi phỏng vấn: "JOIN FETCH có nhược điểm gì không?" ➔ Có! Không nên dùng JOIN FETCH cho nhiều hơn một tập hợp (@OneToMany) cùng lúc vì sẽ sinh ra tích Đề-các (Cartesian Product), làm số bản ghi trả về nhân lên gấp bội, gây tràn bộ nhớ RAM.'
      },
      {
        id: 'transactional-traps',
        title: '2. 3 Cạm Bẫy Chết Người Với @Transactional',
        badge: 'Cạm Bẫy Thường Gặp',
        summary: 'Bỏ quên rollbackFor, dính cạm bẫy Self-Invocation và quên tối ưu readOnly = true cho truy vấn đọc.',
        explanation: `Spring sử dụng cơ chế **AOP Dynamic Proxy** để quản lý transaction. Trước khi vào hàm, Proxy mở connection và bắt đầu transaction; khi hàm chạy xong, Proxy commit; nếu có exception, Proxy rollback.

**3 Cạm bẫy khiến bạn bị fail phỏng vấn hoặc tạo bug trên Production:**
1. **Cạm bẫy 1: Mặc định chỉ rollback với RuntimeException:**
   Nếu phương thức của bạn ném ra một \`Checked Exception\` (ví dụ: \`IOException\`, \`SQLException\`, hoặc class kế thừa trực tiếp từ \`Exception\`), Spring **VẪN SẼ COMMIT** dữ liệu vào database!
   👉 **Khắc phục:** Luôn khai báo: \`@Transactional(rollbackFor = Exception.class)\`.
2. **Cạm bẫy 2: Self-Invocation (Gọi hàm nội bộ):**
   Nếu hàm A (không có @Transactional) gọi hàm B (có @Transactional) trong **CÙNG MỘT CLASS**:
   Lệnh gọi này đi qua con trỏ \`this\` nội bộ chứ không hề đi qua Spring Proxy bọc bên ngoài. Hậu quả: **Transaction của hàm B hoàn toàn không có hiệu lực**!
   👉 **Khắc phục:** Tách hàm B sang một Service riêng biệt.
3. **Cạm bẫy 3: Quên đặt \`readOnly = true\`:**
   Với các hàm chỉ đọc dữ liệu, đặt \`@Transactional(readOnly = true)\` sẽ báo cho Hibernate tắt cơ chế **Dirty Checking** (không cần chụp snapshot của entity để so sánh thay đổi), giúp tiết kiệm lượng lớn CPU và RAM.`,
        badCodeTitle: '❌ Gọi nội bộ tự triệt tiêu Transaction',
        badCode: `@Service
public class OrderService {
    public void process() {
        // Gọi nội bộ qua 'this' ➔ MẤT HOÀN TOÀN @Transactional!
        this.saveOrderWithTx();
    }

    @Transactional // Vô tác dụng khi gọi từ trong cùng class!
    public void saveOrderWithTx() {
        orderRepo.save(new Order());
    }
}`,
        goodCodeTitle: '✅ Tách class và cấu hình rollback chuẩn xác',
        goodCode: `@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderTxService txService; // Inject service riêng

    public void process() {
        txService.saveOrderWithTx(); // Đi qua Spring Proxy ➔ Hoạt động chuẩn!
    }
}

@Service
public class OrderTxService {
    // Luôn chỉ định rollbackFor và readOnly phù hợp
    @Transactional(rollbackFor = Exception.class)
    public void saveOrderWithTx() {
        // ...
    }
}`,
        interviewTip: 'Khi phỏng vấn hỏi về Transaction Isolation Level, hãy nhớ 4 cấp độ: READ UNCOMMITTED (bị Dirty Read), READ COMMITTED (mặc định của PostgreSQL/Oracle, chặn Dirty Read), REPEATABLE READ (mặc định của MySQL InnoDB, chặn Non-repeatable Read), và SERIALIZABLE (chặn Phantom Read, an toàn nhất nhưng chậm nhất).'
      }
    ]
  },
  {
    id: 'testing-qa',
    title: 'Testing & Mockito Thực Chiến',
    icon: '🧪',
    accentColor: '#a78bfa',
    tagline: 'Viết test cho cả nhánh thành công và thất bại để tự tin mở PR mà không sợ vỡ hệ thống',
    topics: [
      {
        id: 'junit-mockito-aaa',
        title: '1. Cấu Trúc Unit Test Chuẩn: Given - When - Then & Mocking',
        badge: 'Phẩm Chất Kỹ Sư',
        summary: 'Sử dụng Mockito để cô lập tầng Service, giả lập hành vi phụ thuộc và kiểm tra tương tác bằng verify().',
        explanation: `Một Unit Test chuyên nghiệp luôn tuân thủ nguyên tắc **FIRST** (Fast, Independent, Repeatable, Self-validating, Timely) và cấu trúc **Given - When - Then** (hoặc AAA: Arrange - Act - Assert):
1. **Given (Arrange):** Chuẩn bị dữ liệu đầu vào và giả lập hành vi của các bên phụ thuộc (\`when(...).thenReturn(...)\`).
2. **When (Act):** Gọi phương thức nghiệp vụ cần kiểm thử.
3. **Then (Assert):** Kiểm chứng kết quả trả về (\`assertEquals\`) và xác minh rằng các phương thức phụ thuộc được gọi đúng số lần (\`verify\`).

**Phân biệt @Mock vs @Spy vs @InjectMocks:**
- \`@Mock\`: Tạo một con bù nhìn giả hoàn toàn rỗng. Nếu không định nghĩa trước thì gọi hàm sẽ trả về \`null\` hoặc \`0\`. Dùng cho các tầng ngoài như Repository, External API.
- \`@Spy\`: Bọc quanh một object **thật**. Code thật vẫn chạy bình thường, trừ những method nào bạn cố tình can thiệp (stub).
- \`@InjectMocks\`: Object mà bạn đang muốn kiểm thử (ví dụ: \`OrderService\`). Mockito sẽ tự động nhét các \`@Mock\` ở trên vào constructor của đối tượng này.`,
        badCodeTitle: '❌ Test chỉ viết cho qua chuyện, không kiểm tra tương tác',
        badCode: `@Test
void testOrder() {
    // Gọi hàm nhưng không assert gì cả, test luôn pass dù code có bug!
    orderService.createOrder(new OrderRequest());
}`,
        goodCodeTitle: '✅ Unit Test chuẩn mực kiểm thử cả trường hợp lỗi',
        goodCode: `@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock private OrderRepository orderRepo;
    @Mock private PaymentGateway paymentGateway;
    @InjectMocks private OrderService orderService;

    @Test
    @DisplayName("Ném ngoại lệ và không lưu DB khi tài khoản không đủ số dư")
    void shouldThrowExceptionWhenInsufficientBalance() {
        // 1. Given
        OrderRequest req = new OrderRequest(1L, new BigDecimal("500.00"));
        when(paymentGateway.hasBalance(1L, req.amount())).thenReturn(false);

        // 2. When & 3. Then
        assertThrows(InsufficientFundsException.class, () -> orderService.createOrder(req));
        
        // Cực kỳ quan trọng: Xác minh rằng hàm save() KHÔNG BAO GIỜ được gọi!
        verify(orderRepo, never()).save(any());
    }
}`,
        interviewTip: 'Người phỏng vấn rất thích ứng viên biết dùng `verify(mock, never()).method()`. Nó chứng minh bạn hiểu rõ luồng nghiệp vụ: khi có lỗi xảy ra thì tuyệt đối không được ghi dữ liệu rác vào cơ sở dữ liệu!'
      },
      {
        id: 'mockmvc-integration',
        title: '2. Integration Test Tầng Controller Với MockMvc',
        badge: 'Test Tích Hợp',
        summary: 'Kiểm tra toàn bộ luồng HTTP Status, Request Validation và JSON Response mà không cần bật Tomcat thật.',
        explanation: `Unit test chỉ kiểm tra logic trong Service. Nhưng làm sao bạn biết annotation \`@Valid\` trên Controller có thực sự chặn được request rỗng? Làm sao biết JSON trả về có đúng format không?
Đó là lúc bạn dùng **MockMvc**:
- MockMvc giả lập luồng xử lý HTTP của Spring DispatcherServlet.
- Chạy cực nhanh vì không cần mở cổng mạng (socket) hay khởi động web server Tomcat thật.
- Kiểm tra trực tiếp được: HTTP Status code, Header, Content-Type và từng trường trong JSON bằng **JsonPath** (\`$.id\`, \`$.name\`).`,
        badCodeTitle: '❌ Test Controller bằng cách bật Postman bấm tay',
        badCode: `// Mở Postman, bấm Send bằng tay mỗi lần sửa code.
// Rất mất thời gian, dễ sót case và không thể chạy tự động trên CI/CD!`,
        goodCodeTitle: '✅ Viết test MockMvc tự động chạy trên CI/CD',
        goodCode: `@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private UserService userService;

    @Test
    @DisplayName("Trả về 400 Bad Request khi email không đúng định dạng")
    void shouldReturn400WhenEmailIsInvalid() throws Exception {
        String invalidPayload = "{\\"name\\": \\"Khuong\\", \\"email\\": \\"not-an-email\\"}";

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.email").exists());
    }
}`,
        interviewTip: 'Phân biệt `@SpringBootTest` (bật toàn bộ context của ứng dụng, chậm hơn) và `@WebMvcTest` (chỉ nạp tầng Controller và MockMvc, chạy nhanh gấp 10 lần).'
      }
    ]
  },
  {
    id: 'clean-code-workplace',
    title: 'Clean Code, Logging & Tác Phong Đi Làm',
    icon: '🛡️',
    accentColor: '#2dd4bf',
    tagline: 'Viết code phẳng dễ đọc, ghi log có bối cảnh và phối hợp chuyên nghiệp trong nhóm',
    topics: [
      {
        id: 'guard-clauses',
        title: '1. Quy Tắc Guard Clauses (Bouncer Pattern): Tiêu Diệt Kim Tự Tháp If-Else',
        badge: 'Clean Code Sống Còn',
        summary: 'Kiểm tra điều kiện lỗi và return sớm ngay tại đầu hàm để luồng chính luôn nằm phẳng ở ngoài cùng.',
        explanation: `Khi xem code của một bạn sinh viên hoặc lập trình viên mới đi làm, dấu hiệu nhận biết rõ nhất là **"Kim Tự Tháp Lồng Nhau" (Pyramid of Doom)**:
\`\`\`java
if (input != null) {
    if (user.isActive()) {
        if (hasPermission) {
            // Logic chính nằm thụt vào 4-5 tab thụt đầu dòng!
        }
    }
}
\`\`\`
Người đọc phải căng não giữ trong đầu 4 tầng điều kiện để hiểu dòng code ở giữa.

**Giải pháp: Bouncer Pattern (Người bảo vệ gác cửa)**
Hãy hình dung người bảo vệ trước cửa quán bar: Ai không đủ tuổi hoặc không có vé thì đuổi về ngay tại cửa!
- Đảo ngược điều kiện \`if\`: kiểm tra các trường hợp không hợp lệ trước.
- Thoát ra ngay lập tức bằng \`return\` hoặc \`throw Exception\`.
- Sau khi qua hết các "người gác cửa", luồng xử lý chính (Happy Path) sẽ nằm phẳng phiu ở cấp thụt lề 0.`,
        badCodeTitle: '❌ Thụt lề 4-5 tầng khó đọc',
        badCode: `public OrderResult checkout(Cart cart, User user) {
    if (cart != null && !cart.isEmpty()) {
        if (user != null && user.isActive()) {
            if (paymentGateway.isOnline()) {
                return doCheckout(cart, user);
            } else {
                return OrderResult.error("Gateway offline");
            }
        } else {
            return OrderResult.error("User invalid");
        }
    }
    return OrderResult.error("Cart empty");
}`,
        goodCodeTitle: '✅ Bouncer Pattern: Phẳng phiu, đọc như danh sách việc cần làm',
        goodCode: `public OrderResult checkout(Cart cart, User user) {
    if (cart == null || cart.isEmpty()) {
        return OrderResult.error("CART_EMPTY", "Giỏ hàng không có sản phẩm");
    }
    if (user == null || !user.isActive()) {
        return OrderResult.error("USER_INACTIVE", "Tài khoản không hợp lệ");
    }
    if (!paymentGateway.isOnline()) {
        return OrderResult.error("GATEWAY_OFFLINE", "Cổng thanh toán tạm dừng");
    }

    // Happy Path nằm phẳng hoàn toàn:
    return doCheckout(cart, user);
}`,
        interviewTip: 'Khi được yêu cầu làm bài test Live Coding, việc áp dụng Guard Clauses ngay từ những dòng code đầu tiên sẽ khiến Senior chấm điểm thán phục vì tác phong code cực kỳ già dặn.'
      },
      {
        id: 'structured-logging',
        title: '2. Nghệ Thuật Ghi Log: SLF4J, Correlation ID & Tại Sao CẤM Println?',
        badge: 'Chuẩn Production',
        summary: 'System.out là I/O đồng bộ làm nghẽn luồng. Dùng SLF4J với tham số {} và gắn Correlation ID để trace lỗi.',
        explanation: `**Tại sao cấm hoàn toàn System.out.println trong dự án?**
1. \`System.out\` thực hiện lệnh I/O đồng bộ (Synchronized Block). Dưới tải cao, hàng ngàn luồng sẽ phải xếp hàng chờ đợi nhau chỉ để in ra 1 dòng chữ, làm sập tốc độ xử lý của server!
2. Không có **Log Level** (không thể tắt log debug khi lên Production).
3. Không ghi nhận được **Timestamp, Thread Name, Class Name** và không thể xuất ra định dạng JSON để hệ thống Elasticsearch/Datadog phân tích.

**Quy tắc ghi log chuẩn doanh nghiệp:**
- Dùng \`log.info("Khởi tạo đơn hàng thành công | id={} | amount={}", id, amount);\` (Luôn dùng placeholder \`{}\` để không tốn chi phí nối chuỗi khi log level bị tắt).
- Gắn **Correlation ID (X-Request-ID)** vào MDC (Mapped Diagnostic Context) ở tầng Filter: Mỗi request đi vào hệ thống sẽ có một mã UUID duy nhất đi kèm trên tất cả các dòng log, giúp bạn lọc chính xác toàn bộ lịch sử của 1 người dùng giữa hàng triệu dòng log!`
      }
    ]
  }
];

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
  }
];

// ==========================================
// 3. MAIN COMPONENT EXPORT
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
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

          {/* ======================================================== */}
          {/* HERO BANNER */}
          {/* ======================================================== */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}>
              <span>🎓 DÀNH CHO INTERN • FRESHER • JUNIOR BACKEND</span>
            </div>

            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              margin: '0 0 12px 0',
              lineHeight: 1.2
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
              fontSize: '1.05rem',
              color: 'rgba(255, 255, 255, 0.75)',
              maxWidth: '820px',
              margin: '0 auto 20px auto',
              lineHeight: 1.6
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
                { label: '5 Khối Kiến Thức Cốt Lõi', desc: 'Core Java • Spring • JPA • Test • Clean Code', color: '#38bdf8' },
                { label: '50 Bí Quyết Thực Chiến', desc: 'Quy tắc vàng sống còn khi đi làm', color: '#ec4899' },
                { label: 'Chiến Thuật Phỏng Vấn', desc: 'Bẫy phỏng vấn & Cách trả lời 10 điểm', color: '#fbbf24' },
                { label: 'Checklist 60 Ngày Thử Việc', desc: `Tiến độ: ${progressPercent}% hoàn thành`, color: '#f97316' }
              ].map((chip, i) => (
                <div key={i} style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '160px'
                }}>
                  <span style={{ color: chip.color, fontWeight: 800 }}>{chip.label}</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', marginTop: '2px' }}>{chip.desc}</span>
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
            marginBottom: '28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px'
          }}>
            {[
              { id: 'lessons', label: '📘 Kho Tri Thức Thực Chiến', color: '#38bdf8' },
              { id: 'tips50', label: '⚡ 50 Bí Quyết Đi Làm', color: '#ec4899' },
              { id: 'interview', label: '🎯 Phỏng Vấn "Trúng Tủ"', color: '#34d399' },
              { id: 'battles', label: '⚔️ Trường Học vs Đi Làm', color: '#fbbf24' },
              { id: 'cv', label: '📄 Bí Kíp Viết CV Backend', color: '#a78bfa' },
              { id: 'probation', label: `📋 Checklist Thử Việc (${progressPercent}%)`, color: '#f97316' }
            ].map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: isActive ? `${tab.color}22` : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isActive ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isActive ? tab.color : 'rgba(255, 255, 255, 0.75)',
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '13.5px',
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
          {activeMainTab === 'lessons' && (
            <div>
              {/* Module Selector Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {KNOWLEDGE_MODULES.map((mod) => {
                  const isSelected = selectedModuleId === mod.id;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => {
                        setSelectedModuleId(mod.id);
                        setSelectedTopicId(mod.topics[0].id);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isSelected ? `${mod.accentColor}18` : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? mod.accentColor : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 0 15px ${mod.accentColor}25` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px' }}>{mod.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? mod.accentColor : '#ffffff' }}>
                          {mod.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.3 }}>
                        {mod.topics.length} chủ đề thực chiến
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Module Header Bar */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${activeModule.accentColor}33`,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: activeModule.accentColor }}>
                    {activeModule.icon} {activeModule.title}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginLeft: '10px' }}>
                    — {activeModule.tagline}
                  </span>
                </div>
              </div>

              {/* Split Layout: Sub-topic Navigation & Deep-dive Content */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'start' }}>
                <style>{`
                  @media (max-width: 820px) {
                    div[style*="gridTemplateColumns: 260px 1fr"] {
                      grid-template-columns: 1fr !important;
                    }
                  }
                `}</style>

                {/* Left: Topic Selector Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeModule.topics.map((t) => {
                    const isTopicSelected = selectedTopicId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTopicId(t.id)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isTopicSelected ? `${activeModule.accentColor}22` : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isTopicSelected ? activeModule.accentColor : 'rgba(255, 255, 255, 0.06)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: `${activeModule.accentColor}22`,
                            color: activeModule.accentColor
                          }}>
                            {t.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: isTopicSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)', lineHeight: 1.35 }}>
                          {t.title}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Deep Dive Content Area */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: `1px solid ${activeModule.accentColor}44`,
                  borderRadius: '12px',
                  padding: '22px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
                }}>
                  {/* Topic Title */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: activeModule.accentColor,
                        color: '#000000'
                      }}>
                        {activeTopic.badge}
                      </span>
                    </div>
                    <h2 style={{ margin: '6px 0', fontSize: '1.4rem', color: '#ffffff' }}>
                      {activeTopic.title}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#a7f3d0', fontWeight: 500 }}>
                      ⚡ {activeTopic.summary}
                    </p>
                  </div>

                  {/* Detailed Explanation Text */}
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.88)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    marginBottom: '18px'
                  }}>
                    {activeTopic.explanation}
                  </div>

                  {/* ASCII Diagram if available */}
                  {activeTopic.asciiDiagram && (
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: activeModule.accentColor, marginBottom: '6px' }}>
                        📊 Sơ Đồ Cơ Chế Bộ Nhớ / Kiến Trúc:
                      </div>
                      <pre style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '14px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        color: '#38bdf8',
                        overflowX: 'auto',
                        lineHeight: 1.4
                      }}>
                        {activeTopic.asciiDiagram}
                      </pre>
                    </div>
                  )}

                  {/* Side-by-Side Code Box */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    {activeTopic.badCode && (
                      <div style={{
                        background: 'rgba(248, 113, 113, 0.05)',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ background: 'rgba(248, 113, 113, 0.15)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                          {activeTopic.badCodeTitle || '❌ Cách làm nghiệp dư'}
                        </div>
                        <pre style={{ margin: 0, padding: '12px', fontSize: '11.5px', background: 'transparent', color: '#fca5a5', overflowX: 'auto', lineHeight: 1.5 }}>
                          <code>{activeTopic.badCode}</code>
                        </pre>
                      </div>
                    )}

                    <div style={{
                      background: 'rgba(52, 211, 153, 0.05)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                        {activeTopic.goodCodeTitle}
                      </div>
                      <pre style={{ margin: 0, padding: '12px', fontSize: '11.5px', background: 'transparent', color: '#a7f3d0', overflowX: 'auto', lineHeight: 1.5 }}>
                        <code>{activeTopic.goodCode}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Interview Pro Tip */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.3)'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '3px' }}>
                      🎯 Bí Kíp Trả Lời Phỏng Vấn Điểm 10:
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                      {activeTopic.interviewTip}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: 50 BÍ QUYẾT ĐI LÀM THỰC CHIẾN */}
          {/* ======================================================== */}
          {activeMainTab === 'tips50' && (
            <div>
              {/* Category Filter & Search Bar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'Core Java & JVM', 'Spring Boot & REST', 'Database & JPA', 'Testing & QA', 'Clean Code & Logging', 'Git & Tác Phong'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTipsCategoryFilter(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: tipsCategoryFilter === cat ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${tipsCategoryFilter === cat ? '#ec4899' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: tipsCategoryFilter === cat ? '#ec4899' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12.5px',
                        fontWeight: tipsCategoryFilter === cat ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat === 'All' ? `Tất cả (${FIFTY_PRACTICAL_TIPS.length})` : cat}
                    </button>
                  ))}
                </div>

                <div style={{ minWidth: '260px' }}>
                  <input
                    type="text"
                    placeholder="Tìm nhanh trong 50 mẹo (vd: N+1, BigDecimal, final, log)..."
                    value={tipsSearchQuery}
                    onChange={(e) => setTipsSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Tips Stats Bar */}
              <div style={{
                marginBottom: '16px',
                fontSize: '12.5px',
                color: 'rgba(255, 255, 255, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>
                  Đang hiển thị <strong>{filteredTips.length}</strong> / 50 bí quyết vàng
                </span>
                <span style={{ fontSize: '11.5px', color: '#ec4899', fontWeight: 600 }}>
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
                          padding: '14px 18px',
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
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            color: '#ffffff'
                          }}>
                            {tip.id}
                          </span>

                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'rgba(255, 255, 255, 0.75)'
                          }}>
                            {tip.category}
                          </span>

                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: `${priorityColor}22`,
                            color: priorityColor,
                            border: `1px solid ${priorityColor}44`
                          }}>
                            {tip.priority}
                          </span>

                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                            {tip.title}
                          </span>
                        </div>

                        <span style={{ color: '#ec4899', fontSize: '18px', fontWeight: 800, flexShrink: 0 }}>
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>

                      {/* Expandable Body */}
                      {isExpanded && (
                        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          {/* Summary Banner */}
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            background: 'rgba(236, 72, 153, 0.06)',
                            border: '1px solid rgba(236, 72, 153, 0.25)',
                            fontSize: '12.5px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            lineHeight: 1.5,
                            marginBottom: '12px'
                          }}>
                            ⚡ <strong>Bản chất vấn đề:</strong> {tip.summary}
                          </div>

                          {/* Detail Explanation */}
                          <div style={{
                            fontSize: '12.5px',
                            color: 'rgba(255, 255, 255, 0.85)',
                            lineHeight: 1.65,
                            marginBottom: (tip.codeBad || tip.codeGood) ? '14px' : '0'
                          }}>
                            {tip.detail}
                          </div>

                          {/* Code Comparison (if available) */}
                          {(tip.codeBad || tip.codeGood) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                              {tip.codeBad && (
                                <div style={{
                                  background: 'rgba(248, 113, 113, 0.05)',
                                  border: '1px solid rgba(248, 113, 113, 0.25)',
                                  borderRadius: '8px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ background: 'rgba(248, 113, 113, 0.15)', padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#f87171' }}>
                                    ❌ Sai lầm thường gặp
                                  </div>
                                  <pre style={{ margin: 0, padding: '10px', fontSize: '11.5px', background: 'transparent', color: '#fca5a5', overflowX: 'auto', lineHeight: 1.45 }}>
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
                                  <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                                    ✅ Chuẩn đi làm (Best Practice)
                                  </div>
                                  <pre style={{ margin: 0, padding: '10px', fontSize: '11.5px', background: 'transparent', color: '#a7f3d0', overflowX: 'auto', lineHeight: 1.45 }}>
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
                padding: '18px',
                marginBottom: '20px'
              }}>
                {/* Search Bar & Stats */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      color: '#34d399',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      🎯 Đang hiển thị {filteredInterviewQuestions.length} / {INTERVIEW_QUESTIONS.length} câu hỏi
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      (Phân loại theo mức độ và chủ đề)
                    </span>
                  </div>

                  <div style={{ minWidth: '260px', flex: '1 1 auto', maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder="Tìm câu hỏi, từ khóa, bẫy phỏng vấn..."
                      value={interviewSearch}
                      onChange={(e) => setInterviewSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Level Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginRight: '4px' }}>
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
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: selectedLevelFilter === lvl.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${selectedLevelFilter === lvl.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: selectedLevelFilter === lvl.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)',
                        fontSize: '11.5px',
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
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginRight: '4px' }}>
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
                    'Kỹ Năng & Live Coding'
                  ].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: selectedCategory === cat ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${selectedCategory === cat ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: selectedCategory === cat ? '#34d399' : 'rgba(255, 255, 255, 0.65)',
                        fontSize: '11.5px',
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
                    color: 'rgba(255, 255, 255, 0.6)'
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
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(52, 211, 153, 0.08)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, marginRight: '16px' }}>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: `${levelBadgeColor}20`,
                              border: `1px solid ${levelBadgeColor}50`,
                              color: levelBadgeColor,
                              textTransform: 'uppercase'
                            }}>
                              {q.level}
                            </span>

                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: `${catBadgeColor}15`,
                              border: `1px solid ${catBadgeColor}35`,
                              color: catBadgeColor
                            }}>
                              {q.category}
                            </span>

                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>
                              {q.question}
                            </span>
                          </div>

                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isExpanded ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isExpanded ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
                            fontSize: '16px',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {isExpanded ? '−' : '+'}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#34d399', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🎯</span> Câu trả lời 30 giây (Elevator Pitch)
                              </div>
                              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.6 }}>
                                {q.shortAnswer}
                              </div>
                            </div>

                            <div style={{
                              padding: '12px 14px',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.06)',
                              border: '1px solid rgba(56, 189, 248, 0.2)',
                              marginBottom: '10px'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🧠</span> Dưới nắp ca-pô (Senior Deep Dive)
                              </div>
                              <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                                {q.seniorDeepDive}
                              </div>
                            </div>

                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: 'rgba(248, 113, 113, 0.08)',
                              border: '1px solid rgba(248, 113, 113, 0.25)'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>⚠️</span> Bẫy phỏng vấn viên sẽ hỏi tiếp
                              </div>
                              <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.5 }}>
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
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚔️</span> Trường Học vs Đi Làm: 8 Trận So Kèo Code Thực Chiến
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.65)' }}>
                      So sánh trực quan giữa thói quen viết code sinh viên/lý thuyết và tiêu chuẩn Production của doanh nghiệp.
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 800
                  }}>
                    Trận {selectedBattleIndex + 1} / {CODE_BATTLES.length}
                  </span>
                </div>

                {/* Battle Switcher */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {CODE_BATTLES.map((battle, idx) => (
                    <button
                      key={battle.id}
                      onClick={() => setSelectedBattleIndex(idx)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: selectedBattleIndex === idx ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${selectedBattleIndex === idx ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: selectedBattleIndex === idx ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)',
                        fontWeight: selectedBattleIndex === idx ? 800 : 500,
                        fontSize: '12px',
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
                      gap: '10px',
                      marginBottom: '14px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          {currentBattle.category}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                          {currentBattle.title}
                        </span>
                      </div>

                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399',
                        fontSize: '11.5px',
                        fontWeight: 800
                      }}>
                        ⚡ Tác động: {currentBattle.impactBadge}
                      </span>
                    </div>

                    {/* Battle Side-by-Side Showcase */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {/* Left: Bad Code */}
                      <div style={{
                        background: 'rgba(248, 113, 113, 0.04)',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ background: 'rgba(248, 113, 113, 0.15)', padding: '10px 14px', fontSize: '12.5px', fontWeight: 700, color: '#f87171' }}>
                          {currentBattle.badTitle}
                        </div>
                        <pre style={{ margin: 0, padding: '16px', fontSize: '12px', lineHeight: 1.55, background: 'transparent', color: '#fca5a5', overflowX: 'auto', flex: 1 }}>
                          <code>{currentBattle.badCode}</code>
                        </pre>
                        <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(248, 113, 113, 0.2)', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
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
                        <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '10px 14px', fontSize: '12.5px', fontWeight: 700, color: '#34d399' }}>
                          {currentBattle.goodTitle}
                        </div>
                        <pre style={{ margin: 0, padding: '16px', fontSize: '12px', lineHeight: 1.55, background: 'transparent', color: '#a7f3d0', overflowX: 'auto', flex: 1 }}>
                          <code>{currentBattle.goodCode}</code>
                        </pre>
                        <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(52, 211, 153, 0.2)', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
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
                padding: '24px',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: '#a78bfa' }}>
                  📄 4 Tiêu Chuẩn Vàng Viết CV Cho Fresher / Junior
                </h2>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6 }}>
                  Technical Recruiter và Tech Lead chỉ dành trung bình <strong>6 giây</strong> để lướt qua một chiếc CV. Dưới đây là cách biến CV của bạn thành thỏi nam châm hút lịch phỏng vấn:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {CV_SECTIONS.map((sec, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
                        {sec.sectionTitle}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                            ✅ NÊN LÀM
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                            {sec.doThis.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>

                        <div style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                            ❌ TUYỆT ĐỐI TRÁNH
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                            {sec.dontDoThis.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '12px',
                        color: '#a7f3d0',
                        lineHeight: 1.5
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
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                    Tiến Độ Sẵn Sàng Vượt Qua 2 Tháng Thử Việc (Probation Survival Tracker)
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: progressPercent >= 70 ? '#34d399' : '#fbbf24' }}>
                    {completedCount} / {PROBATION_TASKS.length} ({progressPercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: progressPercent >= 70 ? 'linear-gradient(90deg, #34d399, #38bdf8)' : 'linear-gradient(90deg, #fbbf24, #f97316)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PROBATION_TASKS.map((t) => {
                  const isChecked = !!checkedProbation[t.id];
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleCheck(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 16px',
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
                        style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#34d399', width: '16px', height: '16px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: t.phase.includes('Tuần 1') ? 'rgba(56, 189, 248, 0.2)' :
                                        t.phase.includes('Tuần 2-4') ? 'rgba(251, 191, 36, 0.2)' : 'rgba(167, 139, 250, 0.2)',
                            color: t.phase.includes('Tuần 1') ? '#38bdf8' :
                                   t.phase.includes('Tuần 2-4') ? '#fbbf24' : '#a78bfa'
                          }}>
                            {t.phase}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: isChecked ? '#a7f3d0' : '#ffffff' }}>
                            {t.text}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
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
            marginTop: '40px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#ffffff' }}>
              Kiến thức vững vàng — Tự tin bước vào dự án thực tế
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '650px', marginInline: 'auto' }}>
              Hãy đào sâu từng chủ đề, viết code mẫu và chạy thử nghiệm trên máy của bạn. Chúc bạn sớm nhận được Offer và vượt qua thử việc xuất sắc!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/technical-knowledge/java/java-overview"
                style={{
                  background: '#38bdf8',
                  color: '#000000',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
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
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
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
