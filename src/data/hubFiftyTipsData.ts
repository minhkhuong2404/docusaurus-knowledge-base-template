export interface PracticalTip {
  id: number;
  category: 'Core Java & JVM' | 'Spring Boot & REST' | 'Database & JPA' | 'Testing & QA' | 'Clean Code & Logging' | 'Git & Tác Phong';
  priority: 'Bắt Buộc' | 'Hiệu Năng' | 'Kiến Trúc' | 'Tác Phong';
  title: string;
  summary: string;
  detail: string;
  codeBad?: string;
  codeGood?: string;
}

export const FIFTY_PRACTICAL_TIPS: PracticalTip[] = [
  // ==========================================
  // PHẦN 1: CORE JAVA & JVM (MẸO 1 - 10)
  // ==========================================
  {
    id: 1,
    category: 'Core Java & JVM',
    priority: 'Hiệu Năng',
    title: 'Tuyệt đối không dùng toán tử "+" để nối chuỗi trong vòng lặp lớn',
    summary: 'Mỗi lần dùng toán tử + trong vòng lặp, Java sẽ tạo ra một đối tượng String và StringBuilder mới trên Heap, gây tràn bộ nhớ và quá tải GC.',
    detail: 'String trong Java là bất biến (immutable). Khi nối chuỗi trong vòng lặp 10,000 lần bằng toán tử +, JVM phải cấp phát và hủy hàng chục ngàn object trung gian trên Heap. Luôn dùng StringBuilder (hoặc StringBuffer nếu cần thread-safe) và gọi .append().',
    codeBad: `String result = "";
for (String item : largeList) {
    result += item; // ❌ Tạo ra hàng chục ngàn object rác trên Heap!
}`,
    codeGood: `StringBuilder sb = new StringBuilder(largeList.size() * 16);
for (String item : largeList) {
    sb.append(item); // ✅ Cực nhanh, tái sử dụng mảng char nội bộ
}
String result = sb.toString();`
  },
  {
    id: 2,
    category: 'Core Java & JVM',
    priority: 'Hiệu Năng',
    title: 'Cẩn trọng với Auto-boxing và Unboxing trong vòng lặp',
    summary: 'Chuyển đổi ngầm định giữa kiểu nguyên thủy (long, int) và Wrapper Object (Long, Integer) làm chậm hiệu năng gấp 10 lần và tiềm ẩn NullPointerException.',
    detail: 'Nếu bạn khai báo biến cộng dồn là Long thay vì long trong vòng lặp tính toán, mỗi lần cộng là một lần unbox -> cộng -> box tạo object Long mới trên Heap. Hơn nữa, nếu một object Wrapper bị null mà đem đi tính toán, JVM sẽ ném NullPointerException ngay lúc unboxing.',
    codeBad: `Long sum = 0L; // ❌ Wrapper object!
for (long i = 0; i < 1_000_000; i++) {
    sum += i; // Mỗi vòng lặp tạo 1 đối tượng Long mới!
}`,
    codeGood: `long sum = 0L; // ✅ Kiểu nguyên thủy nằm trên Stack
for (long i = 0; i < 1_000_000; i++) {
    sum += i; // Chạy tức thì, không tốn 1 byte Heap nào
}`
  },
  {
    id: 3,
    category: 'Core Java & JVM',
    priority: 'Bắt Buộc',
    title: 'Luôn dùng new BigDecimal(String) cho tiền tệ, cấm dùng BigDecimal(double)',
    summary: 'Kiểu double không biểu diễn chính xác số thập phân do chuẩn IEEE 754. Dùng BigDecimal(double) sẽ làm sai lệch số tiền của khách hàng.',
    detail: 'Số 0.1 trong hệ nhị phân của máy tính là số vô hạn tuần hoàn. new BigDecimal(0.1) thực chất sẽ lưu 0.10000000000000000555... dẫn đến việc tính toán hóa đơn bị lệch vài xu. Luôn truyền chuỗi String hoặc dùng BigDecimal.valueOf(double).',
    codeBad: `BigDecimal price = new BigDecimal(0.1); 
// Kết quả thực tế: 0.10000000000000000555111512312578... ❌`,
    codeGood: `BigDecimal price = new BigDecimal("0.1"); // ✅ Chính xác 100%
// Hoặc: BigDecimal.valueOf(0.1);`
  },
  {
    id: 4,
    category: 'Core Java & JVM',
    priority: 'Hiệu Năng',
    title: 'Khai báo initialCapacity cho ArrayList và HashMap khi biết trước số lượng',
    summary: 'Tránh việc Collection phải liên tục resize mảng và copy dữ liệu cũ sang mảng mới khi số phần tử vượt ngưỡng.',
    detail: 'ArrayList mặc định có sức chứa 10. Khi đầy, nó tạo mảng mới lớn hơn 1.5 lần và copy toàn bộ. HashMap mặc định có 16 bucket và loadFactor 0.75; khi thêm phần tử thứ 13, nó phải rehash toàn bộ bảng băm. Định kích thước trước giúp tiết kiệm đáng kể CPU.',
    codeBad: `List<User> list = new ArrayList<>(); // Mặc định capacity = 10
// Phải resize 15 lần nếu thêm 10,000 phần tử!`,
    codeGood: `// Cấp phát trước 1 lần duy nhất:
List<User> list = new ArrayList<>(10_000);
Map<String, User> map = new HashMap<>(Math.max((int) (10_000 / 0.75f) + 1, 16));`
  },
  {
    id: 5,
    category: 'Core Java & JVM',
    priority: 'Hiệu Năng',
    title: 'Hạn chế lạm dụng String.intern() với dữ liệu từ người dùng',
    summary: 'String.intern() đưa chuỗi vào String Constant Pool trong vùng nhớ Metaspace/Native Memory, dễ gây tràn bộ nhớ nếu dữ liệu không giới hạn.',
    detail: 'String pool không được dọn dẹp thường xuyên như Heap thông thường. Nếu bạn gọi .intern() trên các chuỗi sinh ngẫu nhiên từ request của người dùng (như UUID, token), String Pool sẽ phình to không kiểm soát dẫn đến OutOfMemoryError: Metaspace.',
    codeBad: `String userInput = request.getHeader("X-Custom-Header");
String cached = userInput.intern(); // ❌ Rất nguy hiểm nếu header biến thiên liên tục!`,
    codeGood: `// Dùng ConcurrentHashMap hoặc Caffeine Cache có chính sách hết hạn (Eviction policy)
Cache<String, String> cache = Caffeine.newBuilder().maximumSize(10_000).build();`
  },
  {
    id: 6,
    category: 'Core Java & JVM',
    priority: 'Bắt Buộc',
    title: 'Tuyệt đối cấm SimpleDateFormat trong môi trường đa luồng (Multi-threading)',
    summary: 'SimpleDateFormat không hề thread-safe; dùng chung giữa các luồng sẽ làm ngày tháng bị parse sai lệch hoàn toàn.',
    detail: 'SimpleDateFormat lưu trữ trạng thái lịch nội bộ trong quá trình parse. Khi 2 request cùng gọi chung 1 static SimpleDateFormat, dữ liệu của thread này sẽ đè lên thread kia. Hãy chuyển sang java.time (DateTimeFormatter) từ Java 8+, hoàn toàn bất biến và thread-safe.',
    codeBad: `public class DateUtils {
    // ❌ Bị lỗi sai ngày ngẫu nhiên khi có nhiều request đồng thời!
    public static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd");
}`,
    codeGood: `public class DateUtils {
    // ✅ Thread-safe 100%, an toàn đa luồng tuyệt đối
    public static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
}`
  },
  {
    id: 7,
    category: 'Core Java & JVM',
    priority: 'Bắt Buộc',
    title: 'Không bao giờ bắt catch (Throwable t) hoặc nuốt lỗi âm thầm',
    summary: 'Bắt Throwable sẽ nuốt luôn cả các lỗi hệ thống nghiêm trọng như OutOfMemoryError hay StackOverflowError.',
    detail: 'Throwable là cha của cả Exception lẫn Error. Khi JVM bị OutOfMemoryError, nó cần văng ra ngoài để crash hoặc trigger heap dump. Nếu bạn bắt Throwable rồi loginfo nhẹ nhàng, JVM sẽ rơi vào trạng thái thoi thóp (Zombie process), không phục vụ được khách nhưng cũng không chịu chết.',
    codeBad: `try {
    process();
} catch (Throwable t) { // ❌ Nuốt cả lỗi tràn RAM OutOfMemoryError!
    log.error("Có lỗi xảy ra: " + t.getMessage());
}`,
    codeGood: `try {
    process();
} catch (BusinessException ex) {
    log.warn("Nghiệp vụ không hợp lệ: {}", ex.getMessage());
} catch (Exception ex) {
    log.error("Lỗi ứng dụng ngoài dự kiến: ", ex);
    throw ex;
}`
  },
  {
    id: 8,
    category: 'Core Java & JVM',
    priority: 'Bắt Buộc',
    title: 'Luôn dùng try-with-resources cho tất cả I/O, File và JDBC Connection',
    summary: 'Chống rò rỉ File Descriptor và Database Connection khi xảy ra exception ở giữa chừng.',
    detail: 'Nếu dùng try-catch-finally kiểu cũ, nếu lệnh trong finally văng exception thì exception ban đầu trong try sẽ bị nuốt mất. Cú pháp try-with-resources tự động gọi .close() theo chuẩn AutoCloseable, an toàn và ngắn gọn hơn gấp nhiều lần.',
    codeBad: `FileInputStream fis = null;
try {
    fis = new FileInputStream("file.txt");
    // xử lý...
} finally {
    if (fis != null) fis.close(); // Dài dòng, dễ sót nếu có nhiều stream
}`,
    codeGood: `// ✅ Tự động đóng stream an toàn dù có exception hay không
try (var fis = new FileInputStream("file.txt");
     var reader = new BufferedReader(new InputStreamReader(fis))) {
    return reader.readLine();
}`
  },
  {
    id: 9,
    category: 'Core Java & JVM',
    priority: 'Kiến Trúc',
    title: 'Không bao giờ dùng Optional làm trường (field) của Class hoặc tham số hàm',
    summary: 'Optional sinh ra để làm kiểu trả về cho method tìm kiếm có thể rỗng, không sinh ra để lưu trữ trạng thái đối tượng.',
    detail: 'Class Optional không implement interface java.io.Serializable. Nếu bạn đặt Optional làm field trong Entity hoặc DTO, việc tuần tự hóa (Serialization) khi lưu vào Redis hoặc gửi qua Kafka sẽ ném lỗi NotSerializableException.',
    codeBad: `public class UserDto {
    private String name;
    private Optional<String> middleName; // ❌ Cấm! Gây lỗi khi serialize và tốn thêm RAM bọc object
}`,
    codeGood: `public class UserDto {
    private String name;
    private String middleName; // Lưu String bình thường (có thể null)

    // Chỉ dùng Optional ở getter nếu muốn ép người gọi phải check:
    public Optional<String> getMiddleName() {
        return Optional.ofNullable(middleName);
    }
}`
  },
  {
    id: 10,
    category: 'Core Java & JVM',
    priority: 'Tác Phong',
    title: 'Tận dụng tính bất biến (Immutability) với từ khóa final và Record',
    summary: 'Đối tượng bất biến thì tự nhiên an toàn đa luồng (Thread-safe) mà không cần dùng bất kỳ cơ chế khóa (lock) phức tạp nào.',
    detail: 'Khi một object không có setter và toàn bộ field là final, trạng thái của nó không bao giờ bị thay đổi sau khi sinh ra. Bạn có thể chia sẻ nó giữa hàng trăm thread mà không sợ race condition hay corrupt dữ liệu. Từ Java 16+, hãy dùng Record cho tất cả các class DTO/Value Object.',
    codeBad: `public class Money {
    private double amount; // Có thể bị thay đổi ngầm từ thread khác!
    public void setAmount(double amount) { this.amount = amount; }
}`,
    codeGood: `// ✅ Bất biến, an toàn đa luồng tuyệt đối, ngắn gọn
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
    }
}`
  },

  // ==========================================
  // PHẦN 2: SPRING BOOT & REST API (MẸO 11 - 20)
  // ==========================================
  {
    id: 11,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Nói KHÔNG với Field Injection (@Autowired trên field)',
    summary: 'Field Injection phá vỡ tính đóng gói, không thể viết Unit Test thuần với lệnh new, và che giấu vi phạm Single Responsibility.',
    detail: 'Luôn dùng Constructor Injection kết hợp Lombok @RequiredArgsConstructor. Các dependency được đánh dấu final, buộc phải cung cấp khi khởi tạo, giúp bạn dễ dàng mock trong Unit Test mà không cần bật Spring Container.',
    codeBad: `@Service
public class UserService {
    @Autowired
    private UserRepository userRepository; // ❌ Khó viết test, không thể dùng 'final'
}`,
    codeGood: `@Service
@RequiredArgsConstructor // ✅ Tự sinh Constructor cho tất cả các trường final
public class UserService {
    private final UserRepository userRepository;
}`
  },
  {
    id: 12,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Tuyệt đối không để rò rỉ Hibernate Entity ra ngoài Controller',
    summary: 'Trả Entity ra ngoài làm lộ schema database, lộ mật khẩu băm và gây lỗi vỡ trận LazyInitializationException.',
    detail: 'Entity đại diện cho tầng cơ sở dữ liệu nội bộ. DTO đại diện cho hợp đồng API giao tiếp với bên ngoài. Luôn map Entity sang Response DTO trước khi trả về từ Controller. Dùng MapStruct để việc mapping diễn ra tự động và đạt tốc độ tối đa.',
    codeBad: `@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return userRepository.findById(id).orElseThrow(); // ❌ Lộ mật khẩu, dễ nổ lỗi Lazy!
}`,
    codeGood: `@GetMapping("/users/{id}")
public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
    return ResponseEntity.ok(userService.getUserById(id)); // ✅ Trả DTO an toàn
}`
  },
  {
    id: 13,
    category: 'Spring Boot & REST',
    priority: 'Kiến Trúc',
    title: 'Xử lý lỗi tập trung bằng @RestControllerAdvice thay vì try-catch rải rác',
    summary: 'Tách biệt hoàn toàn việc xử lý lỗi ra khỏi luồng nghiệp vụ chính, chuẩn hóa format lỗi trả về cho Frontend theo RFC 7807.',
    detail: 'Để các exception văng tự nhiên từ Service ra ngoài. Tại @RestControllerAdvice, định nghĩa các method @ExceptionHandler để bắt từng loại exception cụ thể và map sang đúng mã HTTP Status (400, 404, 409, 500).',
    codeBad: `@PostMapping("/orders")
public ResponseEntity<?> createOrder(@RequestBody OrderDto dto) {
    try {
        orderService.save(dto);
        return ResponseEntity.ok("Success");
    } catch (Exception e) {
        return ResponseEntity.ok("Error: " + e.getMessage()); // ❌ Trả HTTP 200 kèm chữ lỗi!
    }
}`,
    codeGood: `@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}`
  },
  {
    id: 14,
    category: 'Spring Boot & REST',
    priority: 'Kiến Trúc',
    title: 'Thiết kế RESTful URI bằng danh từ số nhiều, không chứa động từ trong path',
    summary: 'URI đại diện cho tài nguyên (Resource), hành động được thể hiện thông qua các HTTP Method (GET, POST, PUT, DELETE).',
    detail: 'Không đặt URI dạng RPC kiểu /api/v1/getUserById hoặc /api/v1/deleteOrder. Hãy dùng danh từ số nhiều: GET /api/v1/orders/123 (Lấy đơn hàng), DELETE /api/v1/orders/123 (Xóa đơn hàng), POST /api/v1/orders (Tạo đơn hàng).',
    codeBad: `@PostMapping("/api/v1/createOrder") // ❌ Đặt động từ trong URL là sai chuẩn REST!
public OrderDto createOrder(...) {}`,
    codeGood: `@PostMapping("/api/v1/orders") // ✅ Chuẩn RESTful API quốc tế
public ResponseEntity<OrderDto> createOrder(...) {}`
  },
  {
    id: 15,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Sử dụng đúng HTTP Status Codes: Phân biệt 200, 201, 204, 400, 404, 409',
    summary: 'Đừng bao giờ trả về HTTP 200 OK cho mọi trường hợp. Phía client (Web/Mobile) dựa vào HTTP Status để điều hướng màn hình.',
    detail: 'POST tạo mới thành công ➔ trả 201 CREATED (kèm header Location). DELETE thành công không có body ➔ trả 204 NO CONTENT. Dữ liệu gửi lên sai định dạng ➔ trả 400 BAD REQUEST. Trùng mã hoặc xung đột dữ liệu ➔ trả 409 CONFLICT. Không tìm thấy ➔ trả 404 NOT FOUND.',
    codeBad: `@PostMapping("/users")
public UserDto createUser(@RequestBody UserDto dto) {
    return userService.create(dto); // Mặc định trả HTTP 200 thay vì 201!
}`,
    codeGood: `@PostMapping("/users")
public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserDto dto) {
    UserDto created = userService.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created); // ✅ 201 Created
}`
  },
  {
    id: 16,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Luôn validate dữ liệu đầu vào bằng @Valid và Bean Validation tại Controller',
    summary: 'Không bao giờ tin tưởng dữ liệu từ Client gửi lên. Chặn đứng dữ liệu rác ngay tại cửa ngõ Controller.',
    detail: 'Dùng các annotation như @NotNull, @NotBlank, @Min, @Max, @Email trên các trường của Request DTO. Đặt @Valid hoặc @Validated trước @RequestBody ở Controller. Spring sẽ tự động chặn và trả lỗi 400 trước khi dữ liệu đi vào tầng Service.',
    codeBad: `@PostMapping("/register")
public void register(@RequestBody RegisterDto dto) {
    if (dto.getEmail() == null || !dto.getEmail().contains("@")) {
        // Tự check thủ công ở Service rất rườm rà và dễ sót!
    }
}`,
    codeGood: `public record RegisterDto(
    @NotBlank(message = "Username không được để trống") String username,
    @Email(message = "Email không hợp lệ") String email,
    @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự") String password
) {}

@PostMapping("/register")
public ResponseEntity<Void> register(@Valid @RequestBody RegisterDto dto) { ... }`
  },
  {
    id: 17,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Không bao giờ hardcode mật khẩu, API key hay secret trong mã nguồn',
    summary: 'Đưa bí mật vào git repo là con đường ngắn nhất dẫn đến việc bị hacker tấn công hoặc công ty bị phạt bảo mật.',
    detail: 'Tất cả thông tin nhạy cảm phải được đưa vào biến môi trường (Environment Variables) hoặc công cụ quản lý bí mật (Vault, AWS Secrets Manager). Trong application.yml, chỉ tham chiếu thông qua cú pháp: password: ${DB_PASSWORD:default_dev_pass}.',
    codeBad: `// ❌ Hardcode mật khẩu trực tiếp trong code hoặc file config commit lên Git:
String secretKey = "my-super-secret-jwt-key-123456";`,
    codeGood: `// application.yml:
// jwt:
//   secret: \${JWT_SECRET} # ✅ Truyền từ biến môi trường máy chủ Production`
  },
  {
    id: 18,
    category: 'Spring Boot & REST',
    priority: 'Kiến Trúc',
    title: 'Phân tách cấu hình bằng Spring Profiles: local, dev, staging, prod',
    summary: 'Không sửa tay file config mỗi khi deploy; sử dụng các profile application-{profile}.yml riêng biệt.',
    detail: 'Môi trường local dùng H2 hoặc Docker PostgreSQL local; môi trường dev dùng database test; môi trường prod dùng connection pool lớn và bảo mật cao. Chạy ứng dụng với cờ --spring.profiles.active=prod để kích hoạt profile tương ứng.',
    codeBad: `// Sửa tay connection URL trước khi build jar rồi deploy lên production! (Cực kỳ nguy hiểm)`,
    codeGood: `// Tạo các file cấu hình chuyên biệt:
// application-local.yml  (show-sql: true, ddl-auto: update)
// application-prod.yml   (show-sql: false, ddl-auto: validate, pool: 50)`
  },
  {
    id: 19,
    category: 'Spring Boot & REST',
    priority: 'Kiến Trúc',
    title: 'Không bao giờ đặt @Transactional trên tầng Controller',
    summary: 'Đặt transaction ở Controller làm giữ connection database quá lâu trong lúc xử lý các tác vụ I/O mạng hoặc parse JSON.',
    detail: 'Database Connection Pool là tài nguyên đắt đỏ. Transaction chỉ nên được mở ngay trước khi bắt đầu thao tác với cơ sở dữ liệu ở tầng Service, và commit ngay sau khi hoàn tất. Đặt @Transactional ở Controller sẽ khiến connection bị chiếm dụng trong suốt chu kỳ sống của HTTP request.',
    codeBad: `@RestController
@Transactional // ❌ Connection DB bị chiếm dụng suốt thời gian client download dữ liệu!
public class ReportController { ... }`,
    codeGood: `@Service
public class ReportService {
    @Transactional(readOnly = true) // ✅ Chỉ mở transaction đúng nơi thực thi query
    public ReportData generateReport() { ... }
}`
  },
  {
    id: 20,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Giữ Spring Bean không có trạng thái (Stateless) để an toàn đa luồng',
    summary: 'Spring Bean mặc định có scope là Singleton (1 instance duy nhất dùng chung cho hàng ngàn request cùng lúc).',
    detail: 'Nếu bạn khai báo một biến instance trong @Service hoặc @Controller và thay đổi giá trị của nó trong method xử lý request, request của người dùng A sẽ đọc phải dữ liệu của người dùng B, gây ra lỗi Race Condition kinh hoàng trong sản phẩm.',
    codeBad: `@Service
public class OrderService {
    private Long currentUserId; // ❌ CHẾT NGƯỜI: Dùng chung giữa các request đồng thời!
    public void processOrder(Long userId) {
        this.currentUserId = userId; // Bị thread khác ghi đè ngay lập tức!
    }
}`,
    codeGood: `@Service
public class OrderService {
    // ✅ Không lưu trạng thái: truyền dữ liệu qua tham số của method
    public void processOrder(Long userId) {
        // Biến cục bộ trong method nằm trên Stack của riêng từng thread ➔ Thread-safe!
    }
}`
  },

  // ==========================================
  // PHẦN 3: DATABASE, JPA & HIBERNATE (MẸO 21 - 30)
  // ==========================================
  {
    id: 21,
    category: 'Database & JPA',
    priority: 'Bắt Buộc',
    title: 'Luôn luôn dùng FetchType.LAZY cho @ManyToOne và @OneToMany',
    summary: 'Mặc định của @ManyToOne là FetchType.EAGER — nguyên nhân hàng đầu gây chậm chạp và load toàn bộ database vào RAM.',
    detail: 'EAGER ép Hibernate phải tự động JOIN hoặc gửi thêm query để load bảng liên quan dù bạn có cần dùng đến nó hay không. Với LAZY, dữ liệu chỉ được load khi bạn thực sự gọi getter. Mọi mối quan hệ trong entity JPA đều phải khai báo fetch = FetchType.LAZY.',
    codeBad: `@ManyToOne // ❌ Mặc định là FetchType.EAGER! Luôn load Department khi query Employee
private Department department;`,
    codeGood: `@ManyToOne(fetch = FetchType.LAZY) // ✅ Chỉ load khi cần thiết
@JoinColumn(name = "department_id")
private Department department;`
  },
  {
    id: 22,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Đặc trị dứt điểm N+1 Query bằng JOIN FETCH hoặc @EntityGraph',
    summary: 'N+1 xảy ra khi load 1 danh sách cha rồi chạy thêm N câu query để lấy dữ liệu con; khắc phục bằng cách kéo toàn bộ trong 1 query duy nhất.',
    detail: 'Khi cần hiển thị dữ liệu của cả bảng cha và bảng con, không dựa dẫm vào cơ chế lazy load trong vòng lặp. Hãy viết câu JPQL có JOIN FETCH hoặc chú thích @EntityGraph trên phương thức repository để Hibernate sinh đúng 1 câu lệnh SQL có JOIN.',
    codeBad: `List<Order> orders = orderRepo.findAll(); // 1 Query
for (Order o : orders) {
    System.out.println(o.getUser().getName()); // N Queries bắn thêm xuống DB!
}`,
    codeGood: `// ✅ 1 câu SQL duy nhất có LEFT JOIN giải quyết bài toán:
@Query("SELECT o FROM Order o LEFT JOIN FETCH o.user")
List<Order> findAllWithUser();`
  },
  {
    id: 23,
    category: 'Database & JPA',
    priority: 'Bắt Buộc',
    title: 'Luôn khai báo rollbackFor = Exception.class trong @Transactional',
    summary: 'Mặc định Spring @Transactional chỉ rollback khi gặp RuntimeException; gặp Checked Exception nó vẫn COMMIT bình thường!',
    detail: 'Nếu hàm của bạn ném ra IOException, SQLException hoặc bất kỳ class nào kế thừa từ Exception (không phải RuntimeException), dữ liệu trong database vẫn sẽ bị commit, dẫn đến tình trạng giao dịch thanh toán bị lưu một nửa (tiền trừ nhưng đơn không tạo).',
    codeBad: `@Transactional // ❌ Nếu ném Checked Exception thì KHÔNG ROLLBACK!
public void processPayment() throws PaymentException { ... }`,
    codeGood: `@Transactional(rollbackFor = Exception.class) // ✅ Rollback cho tất cả mọi exception
public void processPayment() throws PaymentException { ... }`
  },
  {
    id: 24,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Thêm readOnly = true cho các hàm chỉ đọc dữ liệu từ cơ sở dữ liệu',
    summary: 'Báo cho Hibernate tắt cơ chế Dirty Checking, tiết kiệm đáng kể CPU và giảm 50% lượng RAM tiêu thụ trên Heap.',
    detail: 'Mặc định, khi load entity lên, Hibernate phải giữ một bản sao snapshot trong Persistence Context để khi kết thúc transaction nó so sánh xem bạn có sửa gì không để tự động sinh lệnh UPDATE (Dirty Checking). Với readOnly = true, Hibernate không lưu snapshot này nữa.',
    codeBad: `@Transactional
public UserDto getUser(Long id) { // Tốn tài nguyên theo dõi dirty checking không cần thiết
    return userRepo.findById(id).map(mapper::toDto).orElseThrow();
}`,
    codeGood: `@Transactional(readOnly = true) // ✅ Tắt dirty checking, tối ưu tốc độ tối đa
public UserDto getUser(Long id) {
    return userRepo.findById(id).map(mapper::toDto).orElseThrow();
}`
  },
  {
    id: 25,
    category: 'Database & JPA',
    priority: 'Bắt Buộc',
    title: 'Cảnh giác với cạm bẫy Self-Invocation làm mất hiệu lực @Transactional',
    summary: 'Gọi method có @Transactional từ một method khác trong cùng class sẽ không đi qua Spring Proxy, làm transaction bị vô hiệu hóa.',
    detail: 'Spring AOP bọc một lớp Dynamic Proxy xung quanh Bean để mở và đóng transaction. Khi method A gọi method B trong cùng class, lệnh gọi đi qua con trỏ this nội bộ mà không đi qua Proxy, do đó @Transactional trên method B hoàn toàn bị bỏ qua.',
    codeBad: `@Service
public class OrderService {
    public void checkout() {
        this.saveWithTx(); // ❌ Gọi nội bộ qua 'this': MẤT TRANSACTION!
    }
    @Transactional
    public void saveWithTx() { orderRepo.save(new Order()); }
}`,
    codeGood: `// ✅ Tách method có transaction sang một Service độc lập và inject vào
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderTxService txService;
    public void checkout() {
        txService.saveWithTx(); // Đi qua Spring Proxy ➔ Transaction chạy chuẩn xác!
    }
}`
  },
  {
    id: 26,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Tuyệt đối không viết query SQL bên trong vòng lặp for (Query-in-a-loop)',
    summary: 'Tập hợp các tham số thành một List và dùng mệnh đề WHERE id IN (:ids) để truy vấn theo lô (Batching).',
    detail: 'Gửi 1,000 câu lệnh query riêng biệt xuống database sẽ tốn 1,000 lần Network Round-trip time (độ trễ mạng). Thay vào đó, thu thập 1,000 ID vào một danh sách và gửi 1 câu query duy nhất với WHERE id IN (:ids) để giảm thời gian xử lý từ 5 giây xuống còn 50 mili-giây.',
    codeBad: `for (Long userId : userIds) {
    User u = userRepo.findById(userId).orElse(null); // ❌ 1000 lượt round-trip mạng!
}`,
    codeGood: `// ✅ 1 câu query duy nhất xử lý gọn gàng:
List<User> users = userRepo.findAllById(userIds); // WHERE id IN (...)`
  },
  {
    id: 27,
    category: 'Database & JPA',
    priority: 'Kiến Trúc',
    title: 'Hiểu nguyên tắc tiền tố bên trái (Left-Prefix Rule) khi tạo Composite Index',
    summary: 'Composite Index (cột_A, cột_B, cột_C) chỉ có tác dụng nếu câu truy vấn lọc theo cột_A đầu tiên.',
    detail: 'B-Tree Index được sắp xếp tuần tự theo thứ tự cột định nghĩa. Nếu bạn tạo index trên (tenant_id, status, created_at), câu query WHERE status = "ACTIVE" sẽ KHÔNG THỂ dùng index này và phải quét toàn bộ bảng (Table Scan). Cột có độ chọn lọc cao nhất và hay lọc nhất phải đứng đầu tiên.',
    codeBad: `// Index tạo trên (tenant_id, status)
// Câu query:
SELECT * FROM orders WHERE status = 'PAID'; // ❌ Không dùng được Index!`,
    codeGood: `// Câu query sử dụng đúng tiền tố bên trái:
SELECT * FROM orders WHERE tenant_id = 10 AND status = 'PAID'; // ✅ Tốc độ cực nhanh!`
  },
  {
    id: 28,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Luôn chạy EXPLAIN ANALYZE trước khi đưa câu query phức tạp lên Production',
    summary: 'Đừng đoán mò hiệu năng; hãy nhìn vào Execution Plan để xem query có bị Sequential Scan trên bảng lớn không.',
    detail: 'Nhiều câu query chạy rất nhanh trên máy dev vì bảng chỉ có 20 bản ghi. Khi lên production có 5 triệu bản ghi, việc thiếu index sẽ làm CPU database vọt lên 100%. EXPLAIN ANALYZE cho bạn biết chính xác thời gian thực thi, chi phí cost và kiểu quét dữ liệu (Index Scan vs Seq Scan).',
    codeBad: `// Viết query xong chỉ test trên máy dev rồi deploy ngay (Hậu quả: sập DB production)`,
    codeGood: `EXPLAIN ANALYZE 
SELECT * FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.created_at > '2026-01-01'; // ✅ Kiểm tra Index Scan trước khi deploy`
  },
  {
    id: 29,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Cấu hình HikariCP hợp lý: Pool size lớn hơn chưa chắc đã nhanh hơn',
    summary: 'Công thức vàng tính kích thước pool kết nối: connections = (CPU cores * 2) + disk spindles.',
    detail: 'Nhiều người nghĩ set connection pool = 200 sẽ xử lý nhanh hơn 20. Thực tế, khi CPU chỉ có 8 core mà có 200 connection cạnh tranh, CPU sẽ kiệt sức vì chi phí chuyển ngữ cảnh (Context Switching). Với đa số dịch vụ web, pool size từ 10 đến 20 là con số tối ưu nhất.',
    codeBad: `spring.datasource.hikari.maximum-pool-size: 200 # ❌ Gây quá tải CPU DB vì context switch`,
    codeGood: `spring.datasource.hikari.maximum-pool-size: 20  # ✅ Cân bằng hoàn hảo, đạt throughput cao nhất`
  },
  {
    id: 30,
    category: 'Database & JPA',
    priority: 'Bắt Buộc',
    title: 'Hạn chế dùng CascadeType.ALL hoặc CascadeType.REMOVE bừa bãi',
    summary: 'Rất dễ xảy ra tai nạn xóa sạch toàn bộ bảng con khi chỉ muốn xóa 1 bản ghi cha đơn lẻ.',
    detail: 'CascadeType.REMOVE sẽ tự động xóa tất cả các entity liên quan khi entity gốc bị xóa. Nếu bạn gắn nó trên mối quan hệ giữa Department và Employee, khi bạn xóa 1 phòng ban, toàn bộ nhân viên trong phòng ban đó sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu! Hãy quản lý việc xóa một cách tường minh.',
    codeBad: `@OneToMany(cascade = CascadeType.ALL) // ❌ Quá nguy hiểm! Xóa cha là xóa sạch con
private List<Employee> employees;`,
    codeGood: `@OneToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE}) // ✅ Chỉ tự động lưu/update
private List<Employee> employees;`
  },

  // ==========================================
  // PHẦN 4: TESTING & QA (MẸO 31 - 38)
  // ==========================================
  {
    id: 31,
    category: 'Testing & QA',
    priority: 'Bắt Buộc',
    title: 'Không bao giờ nộp Pull Request mà không có Unit Test đi kèm',
    summary: 'Code không có test là code nợ kỹ thuật (Technical Debt); người khác không dám sửa code của bạn vì sợ làm hỏng.',
    detail: 'Một lập trình viên chuyên nghiệp luôn viết test đi kèm cho từng tính năng mới. Test không chỉ để chứng minh code chạy đúng hôm nay, mà để đảm bảo đồng nghiệp của bạn 6 tháng sau sửa code không làm hỏng tính năng cũ (Regression Testing).',
    codeBad: `// Tạo PR 500 dòng code mới nhưng không có bất kỳ file *Test.java nào đi kèm (Sẽ bị reject ngay)`,
    codeGood: `// Đi kèm OrderService.java là OrderServiceTest.java với đầy đủ test cases cho mọi nhánh if/else`
  },
  {
    id: 32,
    category: 'Testing & QA',
    priority: 'Tác Phong',
    title: 'Tuân thủ cấu trúc AAA (Arrange - Act - Assert) hoặc Given - When - Then',
    summary: 'Giúp bài test có cấu trúc mạch lạc, người đọc nhìn vào hiểu ngay kịch bản kiểm thử trong 5 giây.',
    detail: 'Phần 1: Arrange (Chuẩn bị dữ liệu và mock). Phần 2: Act (Gọi phương thức cần test). Phần 3: Assert (Kiểm tra kết quả và xác minh hành vi). Ba phần này nên được phân cách bằng một dòng trống rõ ràng.',
    codeBad: `@Test void test() {
    when(repo.find(1L)).thenReturn(u);
    assertEquals("Nam", service.getUser(1L).getName()); // Viết dồn 1 dòng rất khó đọc!
}`,
    codeGood: `@Test
void shouldReturnUserWhenExists() {
    // 1. Arrange
    when(repo.findById(1L)).thenReturn(Optional.of(new User("Nam")));
    
    // 2. Act
    UserDto result = service.getUser(1L);
    
    // 3. Assert
    assertEquals("Nam", result.getName());
}`
  },
  {
    id: 33,
    category: 'Testing & QA',
    priority: 'Kiến Trúc',
    title: 'Phân biệt rõ ràng giữa @Mock, @Spy và @InjectMocks trong Mockito',
    summary: '@Mock là đối tượng giả rỗng; @Spy là bọc object thật; @InjectMocks là đối tượng cần kiểm thử.',
    detail: 'Dùng @Mock cho các phụ thuộc bên ngoài như Repository hoặc PaymentService. Dùng @InjectMocks cho class bạn muốn test (ví dụ OrderService). Tránh dùng nhầm @Spy khi bạn không cần gọi logic thật của phụ thuộc.',
    codeBad: `@InjectMocks
private OrderRepository orderRepo; // ❌ Nhầm lẫn! Repository phải là @Mock`,
    codeGood: `@Mock private OrderRepository orderRepo;       // Đối tượng giả lập
@InjectMocks private OrderService orderService;   // Đối tượng cần test`
  },
  {
    id: 34,
    category: 'Testing & QA',
    priority: 'Bắt Buộc',
    title: 'Luôn xác minh verify(mock, never()).action() khi xảy ra lỗi',
    summary: 'Đảm bảo khi gặp ngoại lệ, hệ thống tuyệt đối không thực hiện các hành động làm thay đổi dữ liệu (Side Effects).',
    detail: 'Khi test trường hợp ném ngoại lệ (InsufficientFundsException), việc assertThrows là chưa đủ. Bạn bắt buộc phải dùng verify(orderRepo, never()).save(any()) để chứng minh rằng đơn hàng bị lỗi không bị lưu vào database.',
    codeBad: `@Test
void testError() {
    assertThrows(Exception.class, () -> service.pay(req)); // Thiếu verify, chưa chắc dữ liệu đã an toàn!
}`,
    codeGood: `@Test
void testError() {
    assertThrows(Exception.class, () -> service.pay(req));
    verify(paymentGateway, never()).charge(any()); // ✅ Chứng minh không bị trừ tiền oan!
    verify(orderRepo, never()).save(any());
}`
  },
  {
    id: 35,
    category: 'Testing & QA',
    priority: 'Bắt Buộc',
    title: 'Unit Test phải hoàn toàn độc lập, không phụ thuộc mạng hay thứ tự chạy',
    summary: 'Test phải chạy offline được, không gọi API ngoài thật, và test A không được ảnh hưởng đến kết quả của test B.',
    detail: 'Nếu test của bạn phụ thuộc vào kết nối Internet hoặc yêu cầu Database thật phải có sẵn dữ liệu id = 1, test đó sẽ thất bại ngẫu nhiên trên máy chủ CI/CD của công ty. Luôn mock các cuộc gọi ra bên ngoài.',
    codeBad: `@Test void testPayment() {
    // Gọi thẳng cổng thanh toán VNPay thật trên mạng! (Chậm, tốn tiền và fail khi rớt mạng)
}`,
    codeGood: `@Test void testPayment() {
    when(vnPayClient.pay(any())).thenReturn(PaymentResponse.success()); // ✅ Mock độc lập
}`
  },
  {
    id: 36,
    category: 'Testing & QA',
    priority: 'Hiệu Năng',
    title: 'Dùng @WebMvcTest và MockMvc để test Controller nhanh gấp 10 lần',
    summary: 'Không dùng @SpringBootTest nếu chỉ muốn kiểm tra định dạng JSON và validation ở tầng web.',
    detail: '@SpringBootTest sẽ khởi động toàn bộ ứng dụng, kết nối database và load hàng trăm bean, mất 15-30 giây. @WebMvcTest chỉ nạp đúng Controller và cấu hình MVC cần thiết, chạy xong trong vòng 1 giây.',
    codeBad: `@SpringBootTest // ❌ Quá nặng nề nếu chỉ muốn test 1 cái Controller!
class UserControllerTest { ... }`,
    codeGood: `@WebMvcTest(UserController.class) // ✅ Siêu nhanh, chỉ test tầng Web
class UserControllerTest { ... }`
  },
  {
    id: 37,
    category: 'Testing & QA',
    priority: 'Kiến Trúc',
    title: 'Sử dụng Testcontainers cho Integration Test thay vì cấu hình DB dùng chung',
    summary: 'Testcontainers tự động bật Docker PostgreSQL/MySQL thật lúc chạy test và tự tiêu hủy khi test xong.',
    detail: 'Dùng H2 in-memory đôi khi không tái hiện đúng các hàm đặc thù của PostgreSQL (như JSONB, ILIKE). Testcontainers giúp bạn chạy test trên đúng database engine của production mà không sợ bị đụng dữ liệu giữa các lập trình viên.',
    codeBad: `// Kết nối thẳng vào database test dùng chung của công ty (Người này xóa dữ liệu làm người kia fail test)`,
    codeGood: `@Testcontainers
class OrderIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
}`
  },
  {
    id: 38,
    category: 'Testing & QA',
    priority: 'Tác Phong',
    title: 'Tập trung vào Branch Coverage thay vì chỉ nhìn vào số lượng Line Coverage',
    summary: 'Test bao phủ 100% dòng code không có nghĩa là code không có bug nếu bạn bỏ quên các nhánh logic rẽ nhánh.',
    detail: 'Đừng chỉ test nhánh Happy Path để đạt KPI coverage của công ty. Hãy chủ động test: Danh sách rỗng, String rỗng, số tiền = 0, số âm, ngày tháng trong quá khứ/tương lai, và các ngoại lệ timeout.',
    codeBad: `// Chỉ viết 1 test duy nhất cho case truyền dữ liệu đúng để kéo coverage lên 80%`,
    codeGood: `// Viết test cho cả 4 nhánh: input null, input rỗng, input sai định dạng, input hợp lệ`
  },

  // ==========================================
  // PHẦN 5: CLEAN CODE & LOGGING (MẸO 39 - 44)
  // ==========================================
  {
    id: 39,
    category: 'Clean Code & Logging',
    priority: 'Tác Phong',
    title: 'Áp dụng Guard Clauses (Bouncer Pattern) để dẹp bỏ if-else lồng nhau',
    summary: 'Kiểm tra điều kiện lỗi và return sớm ngay đầu hàm để code đọc thẳng tuột từ trên xuống dưới.',
    detail: 'Đừng bao giờ để code thụt lề 4-5 tầng tab. Hãy kiểm tra các điều kiện thất bại trước (Guard Clauses) và ném exception hoặc return ngay. Luồng xử lý chính sẽ nằm phẳng ở cấp ngoài cùng.',
    codeBad: `if (user != null) {
    if (user.isActive()) {
        if (balance > 0) {
            // Logic chính bị lùi vào tận 3 tab!
        }
    }
}`,
    codeGood: `if (user == null) throw new NotFoundException();
if (!user.isActive()) throw new InactiveException();
if (balance <= 0) throw new InsufficientBalanceException();

// Logic chính nằm phẳng hoàn toàn:
processCheckout(user, balance);`
  },
  {
    id: 40,
    category: 'Clean Code & Logging',
    priority: 'Bắt Buộc',
    title: 'Tuyệt đối CẤM System.out.println và e.printStackTrace() trên Production',
    summary: 'Là I/O đồng bộ (Synchronized) làm block toàn bộ luồng xử lý và không thể chuyển hướng vào hệ thống giám sát tập trung.',
    detail: 'Dùng SLF4J logger (@Slf4j của Lombok). Khi hệ thống chịu tải 10,000 request/giây, System.out sẽ bắt các luồng phải xếp hàng chờ đợi nhau để in ra màn hình console, làm sập tốc độ của server.',
    codeBad: `System.out.println("Processing order: " + id); // ❌ Block I/O!
e.printStackTrace(); // ❌ Làm rò rỉ stack trace ra console mà không vào file log!`,
    codeGood: `@Slf4j
public class OrderService {
    public void process(Long id) {
        log.info("Bắt đầu xử lý đơn hàng | id={}", id); // ✅ Nhanh, có cấu trúc, có thể lọc log level
    }
}`
  },
  {
    id: 41,
    category: 'Clean Code & Logging',
    priority: 'Hiệu Năng',
    title: 'Luôn dùng cú pháp tham số hóa {} trong SLF4J, không dùng phép cộng chuỗi',
    summary: 'Tránh việc JVM phải tốn CPU nối chuỗi khi log level đó đang bị tắt trên Production.',
    detail: 'Nếu bạn viết log.debug("Data: " + complexObject.toString()), dù môi trường production tắt log DEBUG thì phép nối chuỗi vẫn bị thực thi! Dùng log.debug("Data: {}", complexObject) thì hàm toString() chỉ được gọi khi level DEBUG thực sự bật.',
    codeBad: `log.debug("User info: " + user.getDetails()); // ❌ Tốn CPU nối chuỗi dù log DEBUG đang tắt!`,
    codeGood: `log.debug("User info: {}", user.getDetails()); // ✅ Chỉ thực thi khi log level DEBUG được bật`
  },
  {
    id: 42,
    category: 'Clean Code & Logging',
    priority: 'Kiến Trúc',
    title: 'Gắn Correlation ID vào MDC (Mapped Diagnostic Context) để trace log',
    summary: 'Mỗi request đi vào hệ thống sẽ có một mã UUID duy nhất xuất hiện trên mọi dòng log liên quan.',
    detail: 'Trên production có hàng triệu dòng log chạy xen kẽ từ hàng trăm người dùng khác nhau. Bằng cách dùng Filter để sinh requestId và đưa vào MDC.put("requestId", uuid), bạn chỉ cần gõ đúng mã này trên Kibana/Datadog là xem được trọn vẹn lịch sử cuộc gọi.',
    codeBad: `// Log các dòng rời rạc: "Bắt đầu thanh toán", "Lỗi DB" ➔ Không biết dòng nào của người dùng nào!`,
    codeGood: `// Cấu hình log pattern: [%X{requestId}] %-5level %logger - %msg%n
// Kết quả: [req-abc-123] INFO OrderService - Bắt đầu thanh toán cho đơn hàng 999`
  },
  {
    id: 43,
    category: 'Clean Code & Logging',
    priority: 'Bắt Buộc',
    title: 'Tuyệt đối không bao giờ ghi log thông tin nhạy cảm của khách hàng',
    summary: 'Vi phạm nghiêm trọng tiêu chuẩn bảo mật dữ liệu (PCI-DSS, GDPR) và có thể khiến công ty bị phạt nặng.',
    detail: 'Không bao giờ in ra log: Mật khẩu dạng raw, số thẻ tín dụng (PAN), mã CVV, số CCCD/CMND, token bí mật hoặc mã OTP. Hãy che mờ (masking) thông tin nhạy cảm: 4111-XXXX-XXXX-1234 trước khi đưa vào log.',
    codeBad: `log.info("Đăng nhập với password={}", request.getPassword()); // ❌ VI PHẠM PHÁP LUẬT NGHIÊM TRỌNG!`,
    codeGood: `log.info("Yêu cầu đăng nhập | username={} | ip={}", request.getUsername(), clientIp); // ✅ An toàn`
  },
  {
    id: 44,
    category: 'Clean Code & Logging',
    priority: 'Tác Phong',
    title: 'Đặt tên hàm theo ý nghĩa nghiệp vụ (Business Intent) thay vì tên kỹ thuật',
    summary: 'Code tự tài liệu hóa (Self-documenting): Người khác đọc tên hàm là hiểu ngay mục đích kinh doanh.',
    detail: 'Tránh các tên chung chung vô nghĩa như processData, handle, doAction, check. Hãy dùng tên mang ý nghĩa domain: cancelExpiredOrder, calculateShippingFee, suspendAccountIfOverdue.',
    codeBad: `public void handle(Order obj) { ... } // ❌ "handle" cái gì? Xử lý ra sao?`,
    codeGood: `public void markOrderAsPaid(Order orderToFulfill) { ... } // ✅ Đọc là hiểu ngay!`
  },

  // ==========================================
  // PHẦN 6: GIT, PR & TÁC PHONG (MẸO 45 - 50)
  // ==========================================
  {
    id: 45,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Viết Commit Message theo chuẩn Conventional Commits',
    summary: 'Git log chuyên nghiệp giúp cả team dễ dàng tra cứu lịch sử và tự động sinh Changelog khi phát hành.',
    detail: 'Tuân thủ định dạng: type(scope): description. Các type phổ biến: feat (tính năng mới), fix (sửa bug), refactor (tối ưu code), test (viết test), chore (cấu hình build/dependency).',
    codeBad: `git commit -m "fix bug" // ❌ Không ai biết bạn sửa bug gì, ở đâu!
git commit -m "update code"`,
    codeGood: `git commit -m "feat(order): thêm API tính phí vận chuyển theo khu vực (JIRA-123)"
git commit -m "fix(auth): sửa lỗi NullPointerException khi token rỗng"`
  },
  {
    id: 46,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Tạo Pull Request nhỏ gọn (Atomic PR dưới 400 dòng code)',
    summary: 'PR 1,000 dòng code sẽ bị duyệt qua loa với dòng chữ "LGTM" hoặc bị ngâm 2 tuần không ai thèm review.',
    detail: 'Một PR chỉ nên giải quyết đúng một bài toán duy nhất. PR nhỏ (< 400 dòng) giúp Senior review tập trung, phát hiện bug logic sớm, và khi có sự cố thì việc revert code diễn ra vô cùng an toàn và dễ dàng.',
    codeBad: `// PR gồm 45 files: vừa làm tính năng giỏ hàng, vừa sửa bug thanh toán, vừa format lại toàn bộ dự án!`,
    codeGood: `// PR gồm 4 files: Chỉ tập trung hoàn thiện API tính phí vận chuyển + Unit test đi kèm`
  },
  {
    id: 47,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Dùng git rebase thay vì git merge khi cập nhật code từ nhánh chính',
    summary: 'Giữ cho lịch sử commit của nhánh tính năng luôn thẳng hàng, không sinh ra các commit merge rác "Merge branch develop into feature".',
    detail: 'Trước khi mở PR, hãy checkout về develop để git pull mới nhất, sau đó sang nhánh của bạn và chạy git rebase develop. Lịch sử của bạn sẽ được đặt tiếp nối ngay sau commit mới nhất của develop, cực kỳ sạch sẽ.',
    codeBad: `git merge develop // ❌ Sinh ra hàng chục commit merge rác làm rối git tree`,
    codeGood: `git checkout feature/my-task
git rebase develop // ✅ Lịch sử commit thẳng hàng, phẳng phiu`
  },
  {
    id: 48,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Quy tắc 15-30 phút: Tự debug trước khi nhờ Senior trợ giúp',
    summary: 'Không hỏi ngay lập tức khi vừa thấy chữ đỏ, nhưng cũng tuyệt đối không ngồi im chịu trận cả ngày.',
    detail: 'Dành 15-30 phút đọc kỹ Stack Trace từ dưới lên trên, đặt breakpoint trong IDE và google mã lỗi. Nếu sau 30 phút vẫn bế tắc, hãy đi hỏi ngay. Không giấu dốt ngồi ôm lỗi làm trễ hạn bàn giao của cả nhóm.',
    codeBad: `// Vừa thấy console báo lỗi đỏ là quay sang gọi: "Anh ơi code em không chạy!" (Senior rất bực mình)`,
    codeGood: `// Tự debug 20 phút, xác định được dòng lỗi, chuẩn bị log và giả thuyết rồi mới nhờ Senior xem giúp`
  },
  {
    id: 49,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Bộ khung 4 thành phần khi đặt câu hỏi cho Senior',
    summary: 'Hỏi đúng cách giúp Senior hiểu vấn đề trong 10 giây và sẵn lòng hỗ trợ bạn ngay lập tức.',
    detail: 'Cấu trúc câu hỏi chuẩn: 1. Em đang làm tính năng gì? ➔ 2. Triệu chứng lỗi và mã lỗi cụ thể ở dòng nào? ➔ 3. Em đã thử cách A, B nhưng ra kết quả gì? ➔ 4. Giả thuyết của em là gì?',
    codeBad: `"Anh ơi API này bị lỗi 500 anh xem giúp em với" (Zero context, bắt Senior hỏi lại từ đầu)`,
    codeGood: `"Anh ơi, em đang làm API tạo đơn hàng. Khi gọi saveOrder thì bị DataIntegrityViolationException do userId bị null. Em đã debug thấy DTO có userId, em nghi ngờ là trong MapStruct chưa ánh xạ trường này. Khi nào anh rảnh 5 phút anh xem qua giúp em với ạ."`
  },
  {
    id: 50,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Tâm thế khi nhận Code Review: Không tự ái, coi góp ý là lớp học miễn phí',
    summary: 'Người ta chê code của bạn chứ không chê con người bạn; code review là con đường nhanh nhất để lên Senior.',
    detail: 'Khi Senior để lại comment bắt sửa: Không bao giờ phản bác "Nhưng em thấy code em vẫn chạy được mà". Hãy cảm ơn, sửa triệt để và hỏi lại nhẹ nhàng nếu chưa hiểu lý do kiến trúc đằng sau. Thái độ cầu thị chính là yếu tố số 1 giúp bạn pass thử việc xuất sắc!',
    codeBad: `Bỏ qua comment của reviewer hoặc cãi cố: "Code em test trên máy chạy ngon rồi mà anh"`,
    codeGood: `"Em cảm ơn anh đã góp ý. Em đã sửa lại theo hướng dùng Constructor Injection tại commit abcxyz, nhờ anh xem lại giúp em nhé ạ!"`
  },
  {
    id: 51,
    category: 'Git & Tác Phong',
    priority: 'Bắt Buộc',
    title: 'CẤM gõ `git push --force` lên branch chung (main, develop, staging)',
    summary: 'Lệnh force push sẽ ghi đè và xóa sổ toàn bộ commit của đồng nghiệp trong nhóm, làm gãy toàn bộ pipeline CI/CD.',
    detail: 'Trên branch tính năng cá nhân nếu rebase thì dùng git push --force-with-lease để đảm bảo không ghi đè nếu remote có commit mới. Nhưng trên các branch chung, force push là hành động bị coi là "tội đồ". Hãy liên hệ DevOps cài đặt Branch Protection Rule để khóa vĩnh viễn quyền force push.',
    codeBad: `git push origin develop --force // ❌ XÓA SỔ toàn bộ commit mới của các đồng nghiệp khác!`,
    codeGood: `// Trên branch tính năng cá nhân:
git push origin feature/my-task --force-with-lease // ✅ An toàn, chỉ ghi đè nếu chưa ai push lên`
  },
  {
    id: 52,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Quy tắc Estimate Task: Luôn nhân hệ số Buffer 1.5x đến 2.0x',
    summary: 'Lập trình viên mới đi làm thường estimate thời gian viết code thuần túy, bỏ quên 70% thời gian cho test, debug và deploy.',
    detail: 'Nếu bạn nghĩ code tính năng này mất 1 ngày, hãy báo cáo estimate là 1.5 đến 2 ngày. 0.5 - 1 ngày dự phòng (Buffer) dành cho: viết Unit & Integration Tests, giải quyết merge conflict, fix comment review của Senior, cấu hình Docker/DB trên staging và test với QA. Bàn giao sớm hơn dự kiến luôn được đánh giá cao hơn là hứa 1 ngày nhưng 3 ngày mới xong.',
    codeBad: `// Nghĩ: "Code này viết 3 tiếng xong" -> Báo cáo Daily: "Chiều nay em nộp PR nhé anh!"
// Thực tế: Dính bug DB, conflict git, mất 2 ngày -> Bị đánh giá thiếu chuyên nghiệp!`,
    codeGood: `// Dự tính code 1 ngày -> Estimate: 1.5 ngày hoặc 2 ngày
// "Em ước tính task này mất khoảng 2 ngày: 1 ngày hoàn thiện logic chính, nửa ngày viết Unit Test và nửa ngày kiểm thử tích hợp môi trường Staging."`
  },
  {
    id: 53,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Báo cáo Daily Standup ngắn gọn: 3 gạch đầu dòng cốt lõi',
    summary: 'Đừng kể lể dài dòng về việc bạn đã gặp khó khăn ra sao. Hãy nói: Đã hoàn thành gì, Hôm nay làm gì, và Có Blocker nào không.',
    detail: 'Standup chỉ kéo dài 1-2 phút mỗi người. Cấu trúc chuẩn: "Hôm qua em đã xong API thanh toán và viết 5 unit tests. Hôm nay em tiếp tục tích hợp với bên thứ ba VNPay. Hiện tại em đang bị block do chưa có sandbox API key từ Tech Lead, nhờ anh hỗ trợ cấp giúp em." Nói rõ người cần hỗ trợ để buổi họp đạt hiệu quả cao.',
    codeBad: `"Hôm qua em ngồi đọc code module order thấy khó hiểu quá, em google mãi không ra, rồi em thử cách này cách kia cả buổi chiều..." (Kéo dài họp, gây sốt ruột cho team)`,
    codeGood: `"Hôm qua em đã hoàn thành xong CRUD cho Product. Hôm nay em làm tiếp phần tính phí ship. Em không có blocker nào cả ạ."`
  },
  {
    id: 54,
    category: 'Clean Code & Logging',
    priority: 'Kiến Trúc',
    title: 'Gắn Correlation ID (X-Request-ID) vào MDC để trace log xuyên suốt hệ thống',
    summary: 'Khi hệ thống phục vụ hàng ngàn người dùng, một mã UUID duy nhất gắn vào MDC sẽ gom tất cả log của một request lại một chỗ.',
    detail: 'Trong OncePerRequestFilter, tạo hoặc lấy header X-Request-ID, nạp vào SLF4J MDC.put("traceId", traceId). Tất cả log được ghi từ Controller, Service đến DB đều tự động in kèm traceId này. Khi khách hàng báo lỗi kèm traceId, bạn chỉ cần search 1 giây trên Kibana/Datadog là ra toàn bộ hành trình của request đó.',
    codeBad: `log.error("Có lỗi xảy ra khi tạo đơn hàng: {}", e.getMessage()); 
// Không ai biết lỗi này thuộc về người dùng nào giữa 500,000 dòng log!`,
    codeGood: `// Trong Filter:
MDC.put("traceId", UUID.randomUUID().toString());
// Pattern Logback: %d{ISO8601} [%thread] [%X{traceId}] %-5level %logger{36} - %msg%n
// Khi ghi log: Tự động có traceId đi kèm mọi method`
  },
  {
    id: 55,
    category: 'Clean Code & Logging',
    priority: 'Bắt Buộc',
    title: 'Che giấu thông tin nhạy cảm (PII & Secret Masking) trong file Log',
    summary: 'Ghi mật khẩu, số căn cước, token hoặc số thẻ tín dụng ra log là vi phạm luật an toàn thông tin (GDPR, PCI-DSS).',
    detail: 'Không bao giờ log nguyên log.info("Request: {}", req) nếu đối tượng chứa mật khẩu hoặc mã OTP. Hãy dùng custom toString, Jackson @JsonIgnore hoặc Logback Masking Pattern để thay thế các trường nhạy cảm thành ****** hoặc ****1234.',
    codeBad: `log.info("Login request payload: {}", userDto); // ❌ LỘ RÕ password_plain trong file log server!`,
    codeGood: `// Dùng toString loại trừ mật khẩu hoặc record ẩn trường nhạy cảm:
log.info("Yêu cầu đăng nhập | email={} | ip={}", userDto.email(), clientIp);`
  },
  {
    id: 56,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Công thức vàng cấu hình Connection Pool HikariCP: (CPU Cores * 2) + Disk Spindles',
    summary: 'Đừng set đại maximum-pool-size: 100. Quá nhiều connection chỉ làm CPU Database kiệt quệ vì Context Switching.',
    detail: 'Một server Database 4 cores chỉ nên duy trì khoảng 10-15 connection đồng thời. Khi đặt pool quá lớn (ví dụ 100-200), các luồng phải tranh chấp tài nguyên CPU của DB, khiến thời gian phản hồi tăng vọt. Thay vì tăng pool, hãy tối ưu index và rút ngắn thời gian giữ transaction.',
    codeBad: `spring.datasource.hikari.maximum-pool-size: 200 # ❌ Gây quá tải CPU của Database Server!`,
    codeGood: `spring.datasource.hikari.maximum-pool-size: 10 # ✅ Chuẩn cho máy chủ DB 4 cores SSD
spring.datasource.hikari.connection-timeout: 20000 # 20s ném ngoại lệ nếu hết pool`
  },
  {
    id: 57,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Nguyên tắc Tiền Tố Bên Trái (Left-Prefix Rule) khi đánh Composite Index',
    summary: 'Nếu đánh index trên (status, created_at, user_id), câu query WHERE chỉ chạy nhanh nếu có chứa cột status đầu tiên.',
    detail: 'Database B+Tree composite index hoạt động như cuốn từ điển được sắp xếp theo Họ trước, rồi đến Tên đệm, rồi đến Tên. Nếu bạn tìm kiếm chỉ theo created_at mà không có status, DB buộc phải Full Table Scan. Thứ tự các cột trong index phải đi từ cột có tính phân loại cao nhất hoặc hay được lọc nhất.',
    codeBad: `CREATE INDEX idx_order ON orders(status, created_at, user_id);
-- Câu query sau KHÔNG TẬN DỤNG ĐƯỢC INDEX:
SELECT * FROM orders WHERE created_at > '2026-01-01' AND user_id = 5; -- ❌ Full scan!`,
    codeGood: `-- Query chứa tiền tố bên trái tận dụng index tối đa:
SELECT * FROM orders WHERE status = 'COMPLETED' AND created_at > '2026-01-01'; -- ✅ Index Range Scan cực nhanh!`
  },
  {
    id: 58,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Luôn cài đặt Connect Timeout và Read Timeout cho mọi HTTP Client',
    summary: 'HTTP Client mặc định (như RestTemplate hay Feign) không có timeout hoặc timeout vô hạn; đối tác bị treo sẽ kéo sập toàn bộ ứng dụng của bạn.',
    detail: 'Nếu bạn gọi API bên thứ ba mà họ bị nghẽn mạng, luồng của bạn sẽ bị treo vĩnh viễn. Càng nhiều request tới, các thread trong Tomcat pool (mặc định 200 threads) sẽ bị chiếm dụng hết sạch và sập server (Cascading Failure). Luôn cấu hình: connectTimeout = 3s, readTimeout = 5s.',
    codeBad: `RestTemplate restTemplate = new RestTemplate(); // ❌ Mặc định timeout vô hạn!`,
    codeGood: `RestTemplate restTemplate = new RestTemplateBuilder()
    .setConnectTimeout(Duration.ofSeconds(3))
    .setReadTimeout(Duration.ofSeconds(5))
    .build(); // ✅ Trả về lỗi nhanh chóng nếu đối tác treo`
  },
  {
    id: 59,
    category: 'Spring Boot & REST',
    priority: 'Kiến Trúc',
    title: 'Sử dụng Rate Limiting để bảo vệ API khỏi bị spam hoặc brute-force',
    summary: 'Các endpoint nhạy cảm như Đăng nhập, Gửi OTP, Quên mật khẩu bắt buộc phải có giới hạn tần suất gọi request.',
    detail: 'Dùng thuật toán Token Bucket (Resilience4j RateLimiter hoặc Bucket4j kết hợp Redis) để giới hạn ví dụ tối đa 5 request/phút cho 1 địa chỉ IP/User. Khi vượt ngưỡng, trả về ngay HTTP 429 Too Many Requests kèm header Retry-After.',
    codeBad: `@PostMapping("/api/auth/send-otp")
public void sendOtp(@RequestParam String phone) {
    // Không có rate limit -> Hacker viết script gọi 10,000 lần đốt sạch ngân sách SMS!
}`,
    codeGood: `@RateLimiter(name = "otpLimiter", fallbackMethod = "otpRateLimitFallback")
@PostMapping("/api/auth/send-otp")
public ResponseEntity<?> sendOtp(@RequestParam String phone) {
    // Tối đa 3 lần / phút cho mỗi số điện thoại
    return ResponseEntity.ok(otpService.generateAndSend(phone));
}`
  },
  {
    id: 60,
    category: 'Core Java & JVM',
    priority: 'Bắt Buộc',
    title: 'Rò rỉ bộ nhớ kinh điển với ThreadLocal: Luôn gọi remove() trong khối finally',
    summary: 'Tomcat tái sử dụng Thread trong Thread Pool. Quên remove ThreadLocal sẽ làm dữ liệu của user trước rò rỉ sang user sau.',
    detail: 'Khi lưu thông tin UserContext vào ThreadLocal trong Filter, nếu request kết thúc mà bạn quên gọi userThreadLocal.remove(), Thread đó khi quay trở lại Pool vẫn giữ object cũ trong bộ nhớ. Request tiếp theo rơi vào Thread này sẽ đọc nhầm dữ liệu của người khác, gây lỗi bảo mật cực kỳ quái đản!',
    codeBad: `public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
    UserContextHolder.set(extractUser(req));
    chain.doFilter(req, res); // ❌ QUÊN remove(): Dữ liệu lưu vĩnh viễn trên Thread Pool!
}`,
    codeGood: `public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
    try {
        UserContextHolder.set(extractUser(req));
        chain.doFilter(req, res);
    } finally {
        UserContextHolder.clear(); // ✅ BẮT BUỘC gọi trong finally để dọn sạch ThreadLocal!
    }
}`
  },
  {
    id: 61,
    category: 'Core Java & JVM',
    priority: 'Kiến Trúc',
    title: 'Bảo vệ tính đóng gói với Collections.unmodifiableList() và List.copyOf()',
    summary: 'Trả về List nội bộ của Entity hoặc Service cho phép bên ngoài tự ý thêm/xóa phần tử làm sai lệch trạng thái.',
    detail: 'Khi trả về một danh sách từ Getter hoặc DTO, hãy bọc trong Collections.unmodifiableList(items) (Java 8) hoặc List.copyOf(items) (Java 10+). Nếu code bên ngoài cố tình gọi .add() hoặc .clear(), JVM sẽ ném ngay UnsupportedOperationException, đảm bảo an toàn bất biến.',
    codeBad: `public class Cart {
    private List<Item> items = new ArrayList<>();
    public List<Item> getItems() { return this.items; } // ❌ Caller có thể gọi cart.getItems().clear()!
}`,
    codeGood: `public class Cart {
    private final List<Item> items = new ArrayList<>();
    public List<Item> getItems() {
        return Collections.unmodifiableList(this.items); // ✅ Tránh mọi can thiệp ngoài ý muốn
    }
}`
  },
  {
    id: 62,
    category: 'Testing & QA',
    priority: 'Kiến Trúc',
    title: 'Dùng Testcontainers thay cho H2 Database khi chạy Integration Test',
    summary: 'H2 không hỗ trợ các tính năng đặc thù của PostgreSQL/MySQL như JSONB, CTE, Triggers, dẫn đến test pass ở local nhưng tèo trên Production.',
    detail: 'H2 có cú pháp và kiểu dữ liệu khác biệt so với DB thật. Testcontainers tự động bật một Docker container chứa đúng phiên bản PostgreSQL/MySQL thật trong lúc chạy test và tắt đi khi test xong. Test chạy trên môi trường giống 100% Production giúp bạn hoàn toàn an tâm.',
    codeBad: `# Dùng H2 in-memory:
spring.datasource.url: jdbc:h2:mem:testdb # ❌ Các hàm JSON và syntax đặc thù của Postgres không chạy được!`,
    codeGood: `@Testcontainers
@SpringBootTest
class OrderRepositoryTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    // ✅ Chạy trực tiếp trên Postgres thật 100% bằng Docker!
}`
  },
  {
    id: 63,
    category: 'Testing & QA',
    priority: 'Tác Phong',
    title: 'Nguyên tắc F.I.R.S.T: Đảm bảo các bài Unit Test hoàn toàn độc lập',
    summary: 'Unit test không bao giờ được phụ thuộc vào thứ tự chạy hoặc dữ liệu do bài test trước để lại.',
    detail: 'Fast (nhanh dưới vài giây), Independent (không phụ thuộc bài test khác), Repeatable (chạy 1,000 lần trên máy nào cũng ra cùng kết quả), Self-validating (tự pass/fail qua assert, không nhìn bằng mắt), Timely (viết song song với code). Dùng @BeforeEach để làm sạch dữ liệu trước mỗi bài test.',
    codeBad: `static int orderCounter = 0; // ❌ Test sau phụ thuộc vào biến static của test trước`,
    codeGood: `@BeforeEach
void setUp() {
    // ✅ Luôn khởi tạo lại trạng thái trắng (Clean Slate) cho mỗi method test
    orderRepo.deleteAll();
}`
  },
  {
    id: 64,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Xử lý sự cố Production: Quy tắc "Rollback First, Debug Later"',
    summary: 'Khi deploy phiên bản mới làm sập Production hoặc tăng vọt tỉ lệ lỗi 500, ưu tiên số 1 là hồi phục hệ thống ngay lập tức.',
    detail: 'Nhiều bạn mới đi làm khi thấy bug trên Production liền cuống cuồng ngồi debug và thử commit bản vá nóng (hotfix). Đúng chuẩn: 1. Thông báo ngay trên kênh incident ➔ 2. Rollback về phiên bản ổn định trước đó trong vòng 2 phút để cứu khách hàng ➔ 3. Sau khi hệ thống xanh trở lại, mới từ tốn kéo log về điều tra nguyên nhân gốc rễ (Root Cause Analysis).',
    codeBad: `Production báo đỏ -> Ngồi loay hoay sửa code trên máy và commit hotfix trực tiếp -> Lỗi chồng lỗi!`,
    codeGood: `Production báo đỏ -> Bấm nút Revert / Rollback về image Docker cũ ngay -> Hệ thống hồi phục -> Họp Post-mortem tìm nguyên nhân`
  },
  {
    id: 65,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Vượt qua Hội chứng Kẻ giả mạo (Imposter Syndrome): Ai cũng từng là người không biết gì',
    summary: 'Cảm giác mình kém cỏi so với các anh Senior trong team là hoàn toàn bình thường; điều quan trọng là tốc độ học hỏi mỗi ngày.',
    detail: 'Công nghệ phần mềm quá rộng lớn, ngay cả Principal Engineer 15 năm kinh nghiệm cũng phải tra cứu Google hàng ngày. Thay vì so sánh kết quả hiện tại của bạn với đỉnh cao của người khác, hãy so sánh bản thân hôm nay với chính mình của 3 tháng trước: Bạn đã hiểu sâu hơn về JVM, viết code sạch hơn và giải quyết được vấn đề thực tế hơn!',
    codeBad: `Tự ti, không dám hỏi, giấu dốt vì sợ bị đánh giá là "dở" -> Dẫn tới trễ hạn và trầm cảm công sở`,
    codeGood: `Chấp nhận bản thân đang trong giai đoạn học hỏi, ghi chú lại mọi kiến thức mới vào sổ tay/Notion mỗi ngày`
  },
  {
    id: 66,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Bật Graceful Shutdown cho Spring Boot: server.shutdown = graceful',
    summary: 'Khi deploy phiên bản mới trên Kubernetes, tắt đột ngột làm đứt ngang các transaction thanh toán của khách hàng.',
    detail: 'Mặc định Spring Boot tắt ứng dụng ngay lập tức khi nhận tín hiệu SIGTERM. Cấu hình server.shutdown: graceful kết hợp spring.lifecycle.timeout-per-shutdown-phase: 30s sẽ thông báo cho Tomcat ngừng nhận request mới, nhưng cho phép các request đang xử lý dở dang có tối đa 30 giây để hoàn thành trọn vẹn.',
    codeBad: `# Mặc định server.shutdown = immediate:
# K8s gửi SIGTERM -> Server ngắt kết nối ngay lập tức -> Client bị lỗi 502 Bad Gateway!`,
    codeGood: `server:
  shutdown: graceful # Cho phép request đang dở dang hoàn tất
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s # Tối đa 30s trước khi cưỡng chế dừng`
  },
  {
    id: 67,
    category: 'Database & JPA',
    priority: 'Bắt Buộc',
    title: 'Tắt Open-In-View (OSIV): spring.jpa.open-in-view = false',
    summary: 'Mặc định OSIV giữ Database Connection mở từ tận Filter/Controller cho tới khi render xong JSON, làm cạn kiệt Connection Pool.',
    detail: 'Spring Boot mặc định bật OSIV để tránh lỗi LazyInitializationException cho người mới học. Nhưng đi làm, việc giữ connection DB ở tầng Controller/View khiến connection bị chiếm dụng suốt thời gian render JSON hoặc mạng client trễ. Tắt OSIV buộc bạn phải nạp đầy đủ dữ liệu ở tầng Service bằng DTO / JOIN FETCH, bảo vệ Connection Pool.',
    codeBad: `# Mặc định:
spring.jpa.open-in-view: true # ❌ Giữ kết nối DB suốt toàn bộ chu kỳ HTTP request!`,
    codeGood: `spring:
  jpa:
    open-in-view: false # ✅ Giải phóng kết nối DB ngay khi rời tầng Service!
# Dùng JOIN FETCH hoặc DTO Projection để nạp sẵn dữ liệu quan hệ`
  },
  {
    id: 68,
    category: 'Clean Code & Logging',
    priority: 'Bắt Buộc',
    title: 'CẤM tuyệt đối việc bắt ngoại lệ rồi "nuốt lỗi" (Swallow Exception)',
    summary: 'Khối catch (Exception e) {} rỗng hoặc chỉ in e.getMessage() là nguyên nhân của những bug ma quái không thể truy vết.',
    detail: 'Nuốt ngoại lệ khiến hệ thống tiếp tục chạy sai trạng thái mà không có bất kỳ cảnh báo nào. Nếu bạn bắt ngoại lệ, bạn PHẢI làm 1 trong 3 việc: 1. Ghi log error đầy đủ kèm stack trace (log.error("Lỗi xử lý | id={}", id, e)), 2. Thực hiện phương án dự phòng (fallback) hợp lý, hoặc 3. Bọc vào Custom Runtime Exception và ném tiếp ra ngoài.',
    codeBad: `try {
    paymentService.charge(user, amount);
} catch (Exception e) {
    // ❌ NUỐT LỖI HOÀN TOÀN: Tiền không trừ nhưng đơn hàng vẫn giao!
}`,
    codeGood: `try {
    paymentService.charge(user, amount);
} catch (PaymentException e) {
    log.error("Thanh toán thất bại | userId={} | amount={}", user.getId(), amount, e);
    throw new OrderProcessingException("Không thể xử lý giao dịch thanh toán", e);
}`
  },
  {
    id: 69,
    category: 'Core Java & JVM',
    priority: 'Kiến Trúc',
    title: 'Tránh Deadlock đa luồng: Luôn tuân thủ thứ tự lấy Lock cố định (Lock Ordering)',
    summary: 'Deadlock xảy ra khi Thread 1 giữ Lock A chờ Lock B, trong khi Thread 2 giữ Lock B chờ Lock A.',
    detail: 'Khi cần đồng bộ hóa nhiều tài nguyên (ví dụ: chuyển tiền giữa 2 tài khoản A và B), hãy sắp xếp các tài khoản theo một tiêu chí cố định (như so sánh ID: fromId.compareTo(toId)). Luôn khóa tài khoản có ID nhỏ hơn trước, rồi mới khóa tài khoản có ID lớn hơn sau. Cả 2 luồng sẽ luôn lấy lock theo cùng một thứ tự, loại trừ hoàn toàn nguy cơ Deadlock.',
    codeBad: `public void transfer(Account from, Account to, BigDecimal amount) {
    synchronized (from) { // Luồng 1 khóa A chờ B
        synchronized (to) { // Luồng 2 khóa B chờ A -> DEADLOCK ĐỨNG HÌNH SERVER!
            from.debit(amount);
            to.credit(amount);
        }
    }
}`,
    codeGood: `public void transfer(Account from, Account to, BigDecimal amount) {
    Account firstLock = from.getId() < to.getId() ? from : to;
    Account secondLock = from.getId() < to.getId() ? to : from;
    synchronized (firstLock) {
        synchronized (secondLock) { // ✅ Luôn khóa theo thứ tự ID tăng dần -> Không bao giờ Deadlock!
            from.debit(amount);
            to.credit(amount);
        }
    }
}`
  },
  {
    id: 70,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Khai báo Security Headers chuẩn: HSTS, Content-Security-Policy & X-Frame-Options',
    summary: 'Thiếu các HTTP Security Header khiến trang web dễ bị tấn công Clickjacking, Man-in-the-middle hoặc MIME Sniffing.',
    detail: 'Trong cấu hình SecurityFilterChain, luôn kích hoạt các header bảo vệ. HSTS ép buộc trình duyệt chỉ kết nối qua HTTPS; X-Frame-Options: DENY chặn hacker nhúng trang web của bạn vào <iframe> độc hại để lừa click.',
    codeBad: `// Bỏ qua cấu hình headers trong Spring Security -> Dính cảnh báo đỏ trong đợt Pentest bảo mật!`,
    codeGood: `http.headers(headers -> headers
    .frameOptions(frame -> frame.deny()) // Chống Clickjacking
    .xssProtection(Customizer.withDefaults())
    .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
);`
  },
  {
    id: 71,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Viết PR Description theo cấu trúc chuẩn: Why - What - How to test',
    summary: 'Mô tả PR rõ ràng giúp người review nắm bắt ngữ cảnh ngay lập tức và tăng tốc độ merge gấp 3 lần.',
    detail: 'Cấu trúc PR mẫu: 1. [Why]: Liên kết tới Jira Ticket và lý do kinh doanh cần sửa/thêm; 2. [What]: Tóm tắt 3-4 thay đổi kỹ thuật chính; 3. [How to test]: Hướng dẫn các bước cURL / Postman để reviewer tự chạy kiểm thử trên local; 4. [Screenshots]: Đính kèm ảnh chụp Swagger test hoặc UI nếu có.',
    codeBad: `PR Description: "fix bug and update code" (Reviewer không biết test kiểu gì, bắt đầu từ đâu)`,
    codeGood: `### [JIRA-302] Tích hợp cổng thanh toán VNPay QR
- **Why**: Hỗ trợ khách hàng thanh toán nhanh qua ứng dụng ngân hàng.
- **What**: Thêm VNPayClient, cài đặt webhook IPN checksum verification, xử lý callback.
- **How to test**: Chạy \`mvn test\` hoặc import Postman collection trong /docs/postman.`
  },
  {
    id: 72,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Chủ động chuẩn bị cho buổi 1-on-1 định kỳ với Engineering Manager / Tech Lead',
    summary: 'Đừng đợi đến đợt Review tăng lương cuối năm mới chia sẻ khó khăn hoặc nguyện vọng phát triển.',
    detail: 'Buổi 1-on-1 (2-4 tuần/lần) là không gian riêng để nói về con đường sự nghiệp chứ không phải báo cáo task hàng ngày. Hãy chuẩn bị: 1. Điều bạn cảm thấy tự hào trong tháng qua; 2. Những kỹ năng mới bạn muốn được thử sức (Docker, Kafka, System Design); 3. Khó khăn về quy trình làm việc và xin lời khuyên của Lead để thăng tiến.',
    codeBad: `Vào họp 1-on-1 ngồi im: "Dạ em bình thường, không có gì để nói ạ..." (Bỏ lỡ cơ hội thăng tiến)`,
    codeGood: `"Tháng qua em đã pass thử việc và làm chủ module Order. Mục tiêu tháng tới của em là học sâu hơn về Kafka để hỗ trợ anh Nam trong dự án Event-Driven tới ạ."`
  },
  {
    id: 73,
    category: 'Core Java & JVM',
    priority: 'Hiệu Năng',
    title: 'Tránh dùng String.matches() trong vòng lặp - Biên dịch trước Pattern.compile()',
    summary: 'Mỗi lần gọi "abc".matches(regex) là một lần Java biên dịch lại cây Regex từ đầu, làm chậm hiệu năng gấp 20 lần.',
    detail: 'Phương thức String.matches(regex) nội bộ luôn gọi Pattern.compile(regex) mới toanh cho mỗi lần thực thi. Khi cần validate định dạng email hoặc số điện thoại cho 100,000 dòng dữ liệu, hãy khai báo biến hằng số: private static final Pattern EMAIL_PATTERN = Pattern.compile("..."); và gọi EMAIL_PATTERN.matcher(input).matches().',
    codeBad: `for (String email : emailList) {
    if (email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) { // ❌ Biên dịch lại Regex 100,000 lần!
        validList.add(email);
    }
}`,
    codeGood: `private static final Pattern EMAIL_REGEX = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
// ...
for (String email : emailList) {
    if (EMAIL_REGEX.matcher(email).matches()) { // ✅ Cực nhanh, tái sử dụng Automaton đã biên dịch
        validList.add(email);
    }
}`
  },
  {
    id: 74,
    category: 'Database & JPA',
    priority: 'Hiệu Năng',
    title: 'Dùng Keyset Pagination (Seek Method) thay cho OFFSET lớn khi phân trang triệu dòng',
    summary: 'OFFSET 1,000,000 buộc Database phải quét qua 1,000,020 dòng rồi vứt bỏ 1,000,000 dòng đầu, cực kỳ lãng phí I/O.',
    detail: 'Với bảng hàng triệu bản ghi, thay vì dùng LIMIT 20 OFFSET 1000000, hãy dùng Keyset Pagination: WHERE id > :lastSeenId ORDER BY id ASC LIMIT 20. Database nhảy trực tiếp tới vị trí của lastSeenId thông qua B+Tree Index trong 1 phần nghìn giây, bất kể trang thứ 1 hay trang thứ 100,000!',
    codeBad: `SELECT * FROM audit_logs ORDER BY id LIMIT 20 OFFSET 500000; 
-- ❌ DB đọc 500,020 dòng rồi vứt bỏ 500,000 dòng đầu, mất 4.5 giây!`,
    codeGood: `SELECT * FROM audit_logs WHERE id > 500000 ORDER BY id LIMIT 20;
-- ✅ B+Tree Index Seek trực tiếp tới Node 500000, mất đúng 2 mili-giây!`
  },
  {
    id: 75,
    category: 'Testing & QA',
    priority: 'Kiến Trúc',
    title: 'Dùng WireMock để giả lập API bên thứ 3 trong Integration Test',
    summary: 'Không bao giờ gọi cổng thanh toán sandbox thật trong lúc chạy Unit/Integration Test trên CI/CD.',
    detail: 'Sandbox của đối tác có thể chập chờn hoặc không có mạng khi CI/CD chạy trong container kín. WireMock khởi tạo một HTTP Mock Server cục bộ, cho phép bạn giả lập chính xác các kịch bản: HTTP 200 thành công, HTTP 500 lỗi, hoặc giả lập trễ mạng (delayed response) để kiểm thử cơ chế Circuit Breaker.',
    codeBad: `// Gọi trực tiếp https://sandbox.vnpayment.vn trong test CI/CD:
// Khi mất mạng hoặc đối tác bảo trì -> Toàn bộ build CI/CD bị gãy đỏ lòm!`,
    codeGood: `WireMock.stubFor(post(urlEqualTo("/vnpay/charge"))
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody("{\\"status\\": \\"00\\", \\"message\\": \\"Success\\"}")));`
  },
  {
    id: 76,
    category: 'Spring Boot & REST',
    priority: 'Bắt Buộc',
    title: 'Luôn kết hợp @Valid trên Controller và @NotNull, @Size trên DTO Request',
    summary: 'Tin tưởng dữ liệu đầu vào của client là nguồn gốc của 90% lỗi NullPointerException và tấn công SQL Injection.',
    detail: 'Khai báo annotation kiểm tra tính hợp lệ trên từng trường của DTO: @NotBlank, @Size(min = 8, max = 32), @Email, @Min(1). Thêm @Valid trước @RequestBody trong Controller. Spring sẽ tự động chặn request sai ngay tại cửa ngõ và ném MethodArgumentNotValidException.',
    codeBad: `public ResponseEntity<?> createProduct(@RequestBody ProductDto dto) {
    // Không @Valid -> dto.getName() bị null gây lỗi nổ Database ở tầng Service!
}`,
    codeGood: `public record CreateProductRequest(
    @NotBlank(message = "Tên sản phẩm không được để trống") String name,
    @DecimalMin(value = "0.01", message = "Giá phải lớn hơn 0") BigDecimal price
) {}

@PostMapping
public ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest req) { ... }`
  },
  {
    id: 77,
    category: 'Hạ Tầng & Security',
    priority: 'Kiến Trúc',
    title: 'Triển khai Refresh Token Rotation (RTR) để phát hiện token bị trộm',
    summary: 'Mỗi lần đổi Access Token mới, hủy luôn Refresh Token cũ và cấp một Refresh Token mới toanh.',
    detail: 'Nếu một Refresh Token cũ đã bị sử dụng lại một lần nữa, hệ thống lập tức phát hiện token đó đã bị kẻ xấu đánh cắp (Replay Attack) và lập tức thu hồi toàn bộ phiên đăng nhập của người dùng trên mọi thiết bị, bảo vệ an toàn tài khoản tuyệt đối.',
    codeBad: `// Dùng 1 Refresh Token vĩnh viễn trong 30 ngày không bao giờ đổi -> Bị trộm là mất quyền kiểm soát!`,
    codeGood: `// Khi đổi token:
// 1. Kiểm tra refreshToken cũ có trong blacklist/used_tokens không
// 2. Nếu đã từng dùng -> THU HỒI TOÀN BỘ SESSIONS CỦA USER NGAY LẬP TỨC
// 3. Nếu hợp lệ -> Thu hồi token cũ và phát hành refreshToken mới`
  },
  {
    id: 78,
    category: 'Clean Code & Logging',
    priority: 'Kiến Trúc',
    title: 'Tránh Anti-pattern "God Service" - Tách nhỏ Service theo Single Responsibility',
    summary: 'Một file UserService.java phình to 2,000 dòng vừa xử lý đăng ký, thanh toán, gửi email, sinh báo cáo là ác mộng bảo trì.',
    detail: 'Một Service chuyên nghiệp chỉ nên dài tối đa 200-300 dòng và chỉ phục vụ một nhóm nghiệp vụ duy nhất. Hãy phân rã thành: UserRegistrationService, UserCredentialService, UserQueryService. Code ngắn gọn giúp việc đọc hiểu, viết unit test và giải quyết merge conflict trở nên nhẹ nhàng.',
    codeBad: `public class UserService {
    // 45 dependencies, 2,500 dòng code, 60 methods gom đủ mọi thứ trên đời!
}`,
    codeGood: `// Tách thành các service chuyên biệt, phụ thuộc tối đa 3-5 dependencies:
public class UserRegistrationService { ... }
public class UserPasswordResetService { ... }
public class UserProfileQueryService { ... }`
  },
  {
    id: 79,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Viết Technical Design Doc (RFC) cho tính năng lớn trước khi gõ code',
    summary: 'Dành 1 ngày viết tài liệu thiết kế và thống nhất kiến trúc giúp bạn tiết kiệm 2 tuần đập đi xây lại code bẩn.',
    detail: 'Trước khi bắt tay vào một bài toán phức tạp (như đổi cổng thanh toán, tích hợp Kafka), hãy phác thảo tài liệu RFC (Request for Comments): 1. Mục tiêu bài toán; 2. Sơ đồ dữ liệu / Entity quan hệ; 3. Hợp đồng API Request/Response; 4. Các giải pháp thay thế đã cân nhắc. Mời Tech Lead và Senior review trước khi code.',
    codeBad: `Nhận task lớn là mở IDE code hùng hục ngay -> Sau 1 tuần Senior review bắt đập đi viết lại từ đầu vì sai kiến trúc!`,
    codeGood: `Dành 1-2 ngày phác thảo RFC Google Doc -> Thống nhất với Tech Lead và QA -> Code chuẩn xác 100% đúng tiến độ`
  },
  {
    id: 80,
    category: 'Git & Tác Phong',
    priority: 'Tác Phong',
    title: 'Quy tắc Hướng Đạo Sinh (Boy Scout Rule): Luôn để lại codebase sạch sẽ hơn lúc bạn nhận',
    summary: 'Không cần đập đi xây lại cả dự án, chỉ cần mỗi lần chạm vào một class, hãy dọn sạch 1 đoạn code thừa.',
    detail: 'Khi bạn vào sửa một bug trong module cũ, nếu thấy một biến đặt tên khó hiểu hoặc một đoạn System.out.println cũ, hãy tiện tay đổi tên biến rõ ràng hơn và thay bằng log.debug(). Từng cải tiến nhỏ bé tích lũy mỗi ngày sẽ biến một dự án "nợ kỹ thuật chồng chất" trở thành một hệ thống vững chãi và thanh thoát.',
    codeBad: `"Code cũ người ta viết xấu thế nào thì em cứ kệ, em chỉ viết thêm code của em vào thôi"`,
    codeGood: `Tiện tay xóa import thừa, đổi tên biến khó hiểu thành tên có nghĩa, bổ sung 1 bài unit test cho đoạn code vừa sửa`
  }
];
