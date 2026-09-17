export interface InterviewQuestion {
  id: string;
  category: 'Core Java' | 'Spring Boot' | 'Database / JPA' | 'Concurrency & JVM' | 'Testing & QA' | 'Hạ Tầng & Security' | 'Kỹ Năng & Live Coding';
  level: 'Intern' | 'Fresher' | 'Junior';
  question: string;
  shortAnswer: string;
  seniorDeepDive: string;
  trapWarning: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ========================================================
  // PHẦN 1: CORE JAVA (CÂU 1 - 9)
  // ========================================================
  {
    id: 'q-1',
    category: 'Core Java',
    level: 'Intern',
    question: 'Tại sao String trong Java lại bất biến (Immutable)?',
    shortAnswer: 'String là immutable vì 3 lý do sống còn: Tiết kiệm bộ nhớ (String Constant Pool), Bảo mật (chuỗi URL, user/pass không bị thay đổi ngầm trong hàm), và An toàn đa luồng (Thread-safe tự nhiên mà không cần synchronized).',
    seniorDeepDive: 'Mảng byte[] bên trong String được đánh dấu private final. Nếu String có thể thay đổi (mutable), một thread khác có thể đổi chuỗi kết nối Database sau khi đã qua bước kiểm tra quyền (Security Check), dẫn đến lỗ hổng bảo mật nghiêm trọng.',
    trapWarning: 'Phỏng vấn viên sẽ hỏi tiếp: "Vậy làm thế nào để thay đổi giá trị một String nếu cố tình?" ➔ Trả lời: Có thể dùng Reflection để can thiệp vào private field, nhưng từ Java 9+ cơ chế Java Platform Module System (JPMS) đã chặn việc này theo mặc định.'
  },
  {
    id: 'q-2',
    category: 'Core Java',
    level: 'Fresher',
    question: 'HashMap xử lý xung đột băm (Hash Collision) như thế nào?',
    shortAnswer: 'HashMap dùng kỹ thuật Chaining. Khi nhiều key có cùng chỉ số bucket, các phần tử được nối thành một LinkedList. Từ Java 8+, nếu bucket có từ 8 phần tử trở lên và tổng số bucket >= 64, nó tự động chuyển hóa thành Cây Đỏ-Đen (Red-Black Tree) để giảm độ phức tạp từ O(N) xuống O(log N).',
    seniorDeepDive: 'Java dùng thuật toán băm kép (XOR dịch phải 16 bit: h ^ (h >>> 16)) để các bit cao cũng tham gia vào việc phân phối bucket, giảm thiểu tối đa hiện tượng tụ cụm (clustering). Khi số phần tử trong cây giảm xuống dưới 6, nó sẽ tự hạ cấp (untreeify) về LinkedList để tiết kiệm bộ nhớ.',
    trapWarning: 'Phỏng vấn viên sẽ hỏi tiếp: "Nếu override equals() mà không override hashCode() thì điều gì sẽ xảy ra khi đưa vào HashMap?" ➔ Hai object giống hệt nhau sẽ rơi vào hai bucket khác nhau, khiến map.get() trả về null và gây trùng lặp dữ liệu.'
  },
  {
    id: 'q-3',
    category: 'Core Java',
    level: 'Intern',
    question: 'Phân biệt sự khác nhau giữa ArrayList và LinkedList?',
    shortAnswer: 'ArrayList dựa trên mảng động liên tục (Contiguous Array), truy cập ngẫu nhiên O(1), tận dụng tối đa CPU Cache Locality. LinkedList dựa trên các Node con trỏ kép phân tán trên Heap, chèn xóa danh sách tốn thêm bộ nhớ cho con trỏ và duyệt tốn O(N). Thực tế đi làm 99% dùng ArrayList.',
    seniorDeepDive: 'CPU nạp dữ liệu từ RAM vào L1/L2 Cache theo từng Cache Line (thường là 64 bytes). Vì ArrayList là mảng liên tục nên khi đọc 1 phần tử, các phần tử kế tiếp đã nằm sẵn trong Cache. LinkedList rải rác khắp Heap làm CPU liên tục bị Cache Miss.',
    trapWarning: 'Đừng trả lời theo sách giáo khoa cũ: "LinkedList chèn ở giữa nhanh hơn ArrayList". Thực tế để chèn vào vị trí K, LinkedList vẫn mất O(K) để duyệt tới vị trí đó!'
  },
  {
    id: 'q-4',
    category: 'Core Java',
    level: 'Intern',
    question: 'Java là Pass-by-Value hay Pass-by-Reference?',
    shortAnswer: 'Java LUÔN LUÔN là Pass-by-Value (Truyền tham trị) 100% trong mọi trường hợp, không có ngoại lệ!',
    seniorDeepDive: 'Với kiểu nguyên thủy (int, boolean), Java copy giá trị của biến. Với kiểu đối tượng (Object), Java copy "giá trị của địa chỉ tham chiếu". Do đó bạn có thể sửa thuộc tính bên trong object, nhưng nếu bạn gán object = new Object() trong hàm thì object gốc bên ngoài không hề suy chuyển.',
    trapWarning: 'Viết code hàm swap(User a, User b) trên bảng phỏng vấn: Hàm này không bao giờ đổi được 2 đối tượng của caller!'
  },
  {
    id: 'q-5',
    category: 'Core Java',
    level: 'Fresher',
    question: 'Checked Exception khác Unchecked Exception như thế nào?',
    shortAnswer: 'Checked Exception (kế thừa từ Exception, trừ RuntimeException) buộc compiler phải kiểm tra, bắt buộc phải try-catch hoặc throws. Unchecked Exception (kế thừa từ RuntimeException) xảy ra lúc chạy, thường do lỗi logic của lập trình viên (NPE, IllegalArgumentException).',
    seniorDeepDive: 'Thiết kế hiện đại (như Spring Framework) khuyến khích dùng Unchecked Exception cho các lỗi nghiệp vụ vì nó giúp mã nguồn sạch sẽ, không làm ô nhiễm chữ ký hàm (method signature) với hàng loạt mệnh đề throws.',
    trapWarning: 'Hỏi về Error: "Error khác Exception thế nào?" ➔ Error (như OutOfMemoryError, StackOverflowError) là lỗi nghiêm trọng ở cấp JVM mà ứng dụng không nên và không thể phục hồi.'
  },
  {
    id: 'q-6',
    category: 'Core Java',
    level: 'Fresher',
    question: 'Phân biệt map() và flatMap() trong Java Stream API?',
    shortAnswer: 'map() thực hiện ánh xạ 1-1 (biến 1 phần tử thành 1 phần tử khác, T ➔ R). flatMap() thực hiện ánh xạ 1-Nhiều và làm phẳng (Flattening) các stream lồng nhau thành một stream duy nhất (T ➔ Stream<R> ➔ R).',
    seniorDeepDive: 'Nếu bạn có List<Order>, mỗi Order có List<Item>. Gọi orders.stream().map(Order::getItems) sẽ trả về Stream<List<Item>>. Gọi orders.stream().flatMap(o -> o.getItems().stream()) sẽ trả về Stream<Item> phẳng phiu.',
    trapWarning: 'Khi nào dùng flatMap với Optional? Khi phương thức trả về một Optional lồng Optional (ví dụ: user.getProfile().getAddress()), dùng flatMap giúp tránh kiểu Optional<Optional<Address>>.'
  },
  {
    id: 'q-7',
    category: 'Core Java',
    level: 'Fresher',
    question: 'Khi nào nên dùng orElse() và khi nào bắt buộc dùng orElseGet() trong Optional?',
    shortAnswer: 'orElse(value) LUÔN LUÔN thực thi biểu thức bên trong dù Optional có rỗng hay không. orElseGet(() -> supplier) là Lazy Evaluation, CHỈ thực thi khi Optional thực sự rỗng.',
    seniorDeepDive: 'Nếu bên trong orElse bạn gọi một hàm tốn tài nguyên như orElse(callExternalApi()), hàm đó sẽ luôn bị gọi làm chậm hệ thống và tốn chi phí vô ích. Luôn dùng orElseGet() cho các hàm tạo object nặng hoặc gọi database/API.',
    trapWarning: 'Phỏng vấn viên sẽ hỏi: "Có nên dùng opt.get() không?" ➔ Không bao giờ dùng trực tiếp nếu chưa kiểm tra isPresent(), tốt nhất thay bằng orElseThrow().'
  },
  {
    id: 'q-8',
    category: 'Core Java',
    level: 'Intern',
    question: 'Phân biệt final, finally và finalize trong Java?',
    shortAnswer: 'final là từ khóa khai báo hằng số / chặn kế thừa / chặn override. finally là khối lệnh trong try-catch luôn luôn được chạy. finalize là phương thức dọn dẹp trước khi GC thu hồi đối tượng (đã bị deprecated từ Java 9 và loại bỏ).',
    seniorDeepDive: 'Có trường hợp nào khối finally KHÔNG chạy không? Có: 1. Gọi System.exit(0). 2. JVM bị crash (chết đột ngột, cúp điện). 3. Luồng bị kill cưỡng bức ở mức OS (SIGKILL).',
    trapWarning: 'Nếu trong khối try có lệnh return và trong khối finally cũng có lệnh return thì giá trị nào được trả về? ➔ Lệnh return trong finally sẽ ghi đè và nuốt chửng return trong try!'
  },
  {
    id: 'q-9',
    category: 'Core Java',
    level: 'Junior',
    question: 'Record trong Java 16+ có những đặc điểm gì nổi bật so với Class truyền thống?',
    shortAnswer: 'Record là một class bất biến (Immutable Data Carrier) đặc biệt. Compiler tự động sinh ra: private final fields, constructor chuẩn, getters (tên hàm giống tên field, không có tiền tố "get"), equals(), hashCode() và toString().',
    seniorDeepDive: 'Record không thể kế thừa class khác (vì nó đã ngầm kế thừa java.lang.Record), nhưng có thể implement interface. Record không có setter, an toàn tuyệt đối khi dùng làm DTO và Value Object trong kiến trúc đa luồng.',
    trapWarning: 'Field trong Record có bị sửa đổi được không nếu field đó là một List mutable? ➔ Có! Dù con trỏ List là final, nội dung các phần tử bên trong List vẫn có thể bị add/remove. Để bất biến hoàn toàn, cần dùng List.copyOf() trong Compact Constructor.'
  },

  // ========================================================
  // PHẦN 2: CONCURRENCY & JVM (CÂU 10 - 15)
  // ========================================================
  {
    id: 'q-10',
    category: 'Concurrency & JVM',
    level: 'Junior',
    question: 'Từ khóa volatile trong Java giải quyết bài toán gì?',
    shortAnswer: 'volatile giải quyết 2 bài toán sống còn trong đa luồng: 1. Tính hiển thị (Visibility - các thread luôn đọc giá trị mới nhất từ RAM chính, không đọc cache CPU). 2. Chống tái sắp xếp lệnh (Instruction Reordering - Happens-Before relationship).',
    seniorDeepDive: 'Mỗi lõi CPU có L1/L2 cache riêng. Nếu không có volatile, Thread A cập nhật biến flag = true trên L1 cache của Core 1, Thread B chạy trên Core 2 vẫn đọc giá trị cũ flag = false từ L1 của Core 2, dẫn đến vòng lặp vô tận (Infinite Loop). volatile chèn Memory Barrier (rào cản bộ nhớ) ép CPU đồng bộ hóa với RAM chính.',
    trapWarning: 'volatile CÓ đảm bảo tính nguyên tử (Atomicity) cho phép toán count++ không? ➔ KHÔNG! count++ gồm 3 bước (đọc -> cộng 1 -> ghi lại). Phải dùng AtomicInteger hoặc synchronized.'
  },
  {
    id: 'q-11',
    category: 'Concurrency & JVM',
    level: 'Junior',
    question: 'Phân biệt synchronized và ReentrantLock?',
    shortAnswer: 'synchronized là cơ chế khóa nội tại (Implicit Lock) ở cấp độ ngôn ngữ do JVM quản lý, tự động nhả khóa khi hết block. ReentrantLock là class tường minh (Explicit Lock) của java.util.concurrent, hỗ trợ timeout (tryLock), lock công bằng (Fairness) và có thể ngắt (interruptible).',
    seniorDeepDive: 'ReentrantLock được xây dựng dựa trên AbstractQueuedSynchronizer (AQS) sử dụng vòng lặp CAS (Compare-And-Swap) không khóa (Lock-free) ở tầng kernel. synchronized từ Java 6 đã được tối ưu rất nhiều với Biased Locking, Lightweight Locking (Spinlock) và Heavyweight OS Monitor.',
    trapWarning: 'Khi dùng ReentrantLock, bắt buộc phải đặt lock.unlock() trong khối finally, nếu không xảy ra exception thì khóa sẽ bị giữ vĩnh viễn gây Deadlock toàn hệ thống!'
  },
  {
    id: 'q-12',
    category: 'Concurrency & JVM',
    level: 'Junior',
    question: 'Bộ nhớ JVM chia thành những vùng nào? Khi nào bị OutOfMemoryError?',
    shortAnswer: 'Chia làm 5 vùng: Heap (chứa Object, dùng chung), Stack (chứa biến cục bộ & con trỏ, riêng từng thread), Metaspace (chứa metadata của Class, nằm ở Native Memory), Program Counter (PC register), và Native Method Stack.',
    seniorDeepDive: 'OutOfMemoryError có thể xảy ra ở: 1. java.lang.OutOfMemoryError: Java heap space (Heap đầy do memory leak, tạo quá nhiều object sống lâu). 2. Metaspace (nạp quá nhiều class động hoặc rò rỉ classloader). 3. Unable to create new native thread (Hết bộ nhớ OS để cấp phát 1MB stack cho thread mới).',
    trapWarning: 'StackOverflowError khác OutOfMemoryError thế nào? ➔ StackOverflowError xảy ra khi đệ quy vô tận làm vượt quá dung lượng Stack (mặc định ~1MB/thread).'
  },
  {
    id: 'q-13',
    category: 'Concurrency & JVM',
    level: 'Junior',
    question: 'Thread Pool hoạt động như thế nào? Phân biệt corePoolSize và maximumPoolSize?',
    shortAnswer: 'Khi có task mới: 1. Nếu số thread < corePoolSize, tạo thread mới. 2. Nếu đã đủ corePoolSize, task được đẩy vào BlockingQueue. 3. Nếu hàng đợi đầy VÀ số thread < maximumPoolSize, tạo thread mới. 4. Nếu hàng đợi đầy VÀ đạt max thread, kích hoạt Rejection Policy.',
    seniorDeepDive: 'Lỗi chết người của lập trình viên là dùng Executors.newFixedThreadPool() hoặc newCachedThreadPool(). FixedThreadPool dùng LinkedBlockingQueue không giới hạn (Integer.MAX_VALUE), khi request tràn vào hàng đợi sẽ gây tràn RAM sập server. Luôn khởi tạo ThreadPoolExecutor thủ công với dung lượng hàng đợi giới hạn (ArrayBlockingQueue).',
    trapWarning: 'Có những Rejection Policy nào khi Thread Pool quá tải? ➔ 1. AbortPolicy (ném exception - mặc định). 2. CallerRunsPolicy (bắt thread gọi phải tự chạy task, giúp giảm tốc độ gửi request). 3. DiscardPolicy (bỏ qua âm thầm). 4. DiscardOldestPolicy (bỏ task cũ nhất).'
  },
  {
    id: 'q-14',
    category: 'Concurrency & JVM',
    level: 'Junior',
    question: 'Virtual Threads (Project Loom trong Java 21) giải quyết bài toán gì?',
    shortAnswer: 'Virtual Threads là luồng ảo do JVM quản lý ở không gian người dùng (User Space), siêu nhẹ (chỉ tốn vài KB RAM so với 1MB của OS Thread). Nó cho phép một ứng dụng chạy hàng triệu luồng đồng thời theo mô hình Thread-per-Request mà không lo cạn kiệt tài nguyên.',
    seniorDeepDive: 'Khi một Virtual Thread thực hiện tác vụ I/O chặn (như gọi database hoặc HTTP), JVM sẽ tự động tháo (unmount) luồng ảo này ra khỏi OS Carrier Thread để Carrier Thread đó chạy luồng khác. Khi I/O xong, luồng ảo được gắn lại (mount) để chạy tiếp.',
    trapWarning: 'Có nên dùng Thread Pool cho Virtual Threads không? ➔ KHÔNG! Virtual Threads sinh ra để tạo và vứt đi, không cần pool. Lỗi Pinning: Tránh dùng synchronized block bên trong Virtual Thread vì nó sẽ ghim chặt vào Carrier Thread, làm mất tác dụng của Loom; hãy thay bằng ReentrantLock.'
  },

  // ==========================================
  // PHẦN 3: SPRING BOOT & REST (CÂU 15 - 22)
  // ==========================================
  {
    id: 'q-15',
    category: 'Spring Boot',
    level: 'Intern',
    question: 'Spring Bean có những Scope nào? Mặc định là gì và có Thread-safe không?',
    shortAnswer: '5 Scope chính: Singleton (mặc định), Prototype (mỗi lần inject tạo object mới), Request, Session, Application. Mặc định là Singleton và KHÔNG TỰ ĐỘNG THREAD-SAFE!',
    seniorDeepDive: 'Singleton Bean chỉ có duy nhất 1 instance trong toàn bộ ApplicationContext, được chia sẻ cho hàng ngàn HTTP request đồng thời. Do đó, nếu bạn lưu trữ dữ liệu người dùng trong biến instance của @Service, các request sẽ đọc đè dữ liệu của nhau. Bean phải luôn ở trạng thái không trạng thái (Stateless).',
    trapWarning: 'Làm thế nào để inject một Prototype Bean vào một Singleton Bean mà mỗi lần gọi đều ra instance mới? ➔ Nếu inject thông thường thì Prototype chỉ được tạo 1 lần lúc bootstrap! Cần dùng @Lookup hoặc ObjectProvider<T>.'
  },
  {
    id: 'q-16',
    category: 'Spring Boot',
    level: 'Fresher',
    question: 'Vòng đời (Lifecycle) của một Spring Bean diễn ra như thế nào?',
    shortAnswer: 'Khởi tạo Constructor ➔ Inject Dependencies ➔ Gọi các Aware Interfaces (BeanNameAware, ApplicationContextAware) ➔ BeanPostProcessor (Before Initialization) ➔ @PostConstruct / InitializingBean ➔ BeanPostProcessor (After Initialization - nơi bọc Spring AOP Proxy) ➔ Sẵn sàng sử dụng ➔ @PreDestroy / DisposableBean khi shutdown.',
    seniorDeepDive: 'Spring AOP Proxy (như @Transactional, @Async) được bọc ngoài Bean ở bước postProcessAfterInitialization. Đó là lý do tại sao các phương thức gọi nội bộ trong class (Self-invocation) không kích hoạt được Transaction vì con trỏ "this" trỏ vào Bean gốc chứ không trỏ vào Proxy!',
    trapWarning: 'Trong Constructor của Bean có thể gọi các method phụ thuộc vào @Value hoặc @Autowired không? ➔ Không, vì lúc chạy Constructor thì Spring chưa kịp inject dependency vào! Hãy đưa logic đó vào method có @PostConstruct.'
  },
  {
    id: 'q-17',
    category: 'Spring Boot',
    level: 'Intern',
    question: '@SpringBootApplication cấu thành từ 3 annotation cốt lõi nào?',
    shortAnswer: '1. @SpringBootConfiguration (đánh dấu class cấu hình). 2. @EnableAutoConfiguration (kích hoạt cơ chế tự động cấu hình bean dựa trên classpath). 3. @ComponentScan (quét các package con để tìm @Component, @Service, @Repository).',
    seniorDeepDive: '@EnableAutoConfiguration hoạt động dựa trên file META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports (trước Java 3 là spring.factories). Nó sử dụng hàng loạt điều kiện @ConditionalOnClass, @ConditionalOnMissingBean để quyết định có tạo bean hay không.',
    trapWarning: 'Nếu đặt class Main ở package com.example.app.main thì có quét được các @Service ở package com.example.app.service không? ➔ Không! Vì @ComponentScan mặc định chỉ quét package chứa class Main và các package con của nó.'
  },
  {
    id: 'q-18',
    category: 'Spring Boot',
    level: 'Fresher',
    question: 'Phân biệt @Controller và @RestController?',
    shortAnswer: '@Controller dùng cho ứng dụng web truyền thống (trả về tên View/Template như HTML, JSP). @RestController = @Controller + @ResponseBody, tự động serialize kết quả trả về của hàm thành dữ liệu JSON hoặc XML gửi thẳng về client.',
    seniorDeepDive: 'Khi dùng @RestController, Spring sử dụng HttpMessageConverter (mặc định là Jackson ObjectMapper) để chuyển đổi đối tượng Java sang JSON. Bạn có thể can thiệp vào quá trình này bằng Jackson Custom Serializer hoặc cấu hình ObjectMapper bean.',
    trapWarning: 'Nếu dùng @Controller mà muốn 1 method trả về JSON thì làm sao? ➔ Gắn thêm annotation @ResponseBody ngay trên method đó.'
  },
  {
    id: 'q-19',
    category: 'Spring Boot',
    level: 'Junior',
    question: 'Spring AOP hoạt động dựa trên cơ chế nào? Phân biệt JDK Dynamic Proxy và CGLIB Proxy?',
    shortAnswer: 'Spring AOP hoạt động dựa trên Proxy Pattern (tạo một đối tượng bọc ngoài để can thiệp trước/sau khi hàm chạy). JDK Dynamic Proxy chỉ tạo proxy được cho các class implement Interface. CGLIB Proxy tạo proxy bằng cách kế thừa và override method của class (sinh bytecode động).',
    seniorDeepDive: 'Từ Spring Boot 2.x+, Spring mặc định sử dụng CGLIB Proxy cho tất cả các bean (spring.aop.proxy-target-class=true). Vì CGLIB tạo subclass nên class hoặc method được đánh dấu final sẽ KHÔNG THỂ tạo proxy được (làm mất @Transactional).',
    trapWarning: 'Method private có áp dụng được @Transactional hay @Async không? ➔ Không bao giờ! Vì Proxy bên ngoài không thể override hay truy cập vào method private.'
  },
  {
    id: 'q-20',
    category: 'Spring Boot',
    level: 'Junior',
    question: 'Spring Security hoạt động như thế nào? Giải thích kiến trúc Filter Chain?',
    shortAnswer: 'Spring Security bản chất là một chuỗi các Servlet Filter (SecurityFilterChain) đứng chặn trước DispatcherServlet. Mọi request đi vào đều phải đi qua các filter kiểm tra: trích xuất token/session ➔ nạp thông tin UserDetails ➔ xác thực (Authentication) ➔ phân quyền (Authorization) ➔ lưu vào SecurityContextHolder.',
    seniorDeepDive: 'DelegatingFilterProxy là cầu nối giữa Servlet Container (Tomcat) và Spring ApplicationContext. Nó ủy quyền việc kiểm tra cho FilterChainProxy. Khi dùng JWT, ta viết một OncePerRequestFilter tùy chỉnh đứng trước UsernamePasswordAuthenticationFilter để trích xuất Bearer Token.',
    trapWarning: 'SecurityContextHolder lưu thông tin người dùng ở đâu? ➔ Mặc định lưu trong ThreadLocal (MODE_THREADLOCAL). Điều này có nghĩa là nếu bạn dùng @Async hoặc spawn thread mới, thread con sẽ không lấy được thông tin đăng nhập nếu không cấu hình SecurityContextHolderStrategy phù hợp!'
  },

  // ==========================================
  // PHẦN 4: DATABASE, JPA & HIBERNATE (CÂU 21 - 27)
  // ==========================================
  {
    id: 'q-21',
    category: 'Database / JPA',
    level: 'Fresher',
    question: 'Entity trong JPA có những trạng thái (Lifecycle States) nào?',
    shortAnswer: '4 trạng thái: 1. Transient/New (vừa new, chưa lưu DB, chưa có trong Persistence Context). 2. Managed/Persistent (đã liên kết với EntityManager, mọi thay đổi tự động update qua Dirty Checking). 3. Detached (session đóng hoặc gọi detach, không theo dõi nữa). 4. Removed (đã đánh dấu xóa).',
    seniorDeepDive: 'Cơ chế Dirty Checking: Khi một entity ở trạng thái Managed, bạn chỉ cần gọi user.setName("Mới") mà KHÔNG CẦN gọi repo.save(user). Khi transaction commit, Hibernate tự so sánh entity hiện tại với bản snapshot lúc load lên và sinh lệnh UPDATE tương ứng.',
    trapWarning: 'Gọi repo.save() trên một entity đã Managed có thừa không? ➔ Thừa! Nhưng nếu gọi trên một entity Detached thì save() (thực chất là em.merge()) sẽ copy dữ liệu sang một instance Managed mới.'
  },
  {
    id: 'q-22',
    category: 'Database / JPA',
    level: 'Junior',
    question: 'Phân biệt Optimistic Locking và Pessimistic Locking trong cơ sở dữ liệu?',
    shortAnswer: 'Pessimistic Locking (Khóa bi quan) khóa cứng dòng dữ liệu tại Database (SELECT ... FOR UPDATE), ngăn chặn mọi giao dịch khác đọc/ghi. Optimistic Locking (Khóa lạc quan) không khóa DB, dùng cột @Version để kiểm tra xung đột lúc UPDATE; nếu version bị đổi thì ném OptimisticLockException.',
    seniorDeepDive: 'Chọn khóa nào phụ thuộc vào tỉ lệ xung đột: Ứng dụng đọc nhiều ghi ít (E-commerce xem hàng, đặt đơn) dùng Optimistic Lock để đạt throughput cao. Hệ thống tài chính, mua vé ghế rạp phim, flash sale số lượng cực ít cạnh tranh cao nên dùng Pessimistic Lock hoặc Redis Distributed Lock.',
    trapWarning: 'Khi OptimisticLockException xảy ra thì ứng dụng phải làm gì? ➔ Cần bắt exception và thực hiện cơ chế Thử lại (Retry Pattern) với dữ liệu mới nhất.'
  },
  {
    id: 'q-23',
    category: 'Database / JPA',
    level: 'Fresher',
    question: 'LazyInitializationException là gì và nguyên nhân gốc rễ do đâu?',
    shortAnswer: 'Lỗi xảy ra khi bạn truy cập vào một thuộc tính liên kết LAZY (ví dụ order.getItems()) trong khi Hibernate Session (Persistence Context) đã bị đóng.',
    seniorDeepDive: 'Trong mô hình chuẩn, Transaction và Hibernate Session kết thúc ở tầng Service. Khi Controller hoặc Jackson JSON Serializer cố gọi getter của một LAZY proxy, Hibernate không còn connection nào đến DB để nạp dữ liệu nữa và nổ LazyInitializationException.',
    trapWarning: 'Có nên bật cấu hình spring.jpa.open-in-view=true (OSIV) để hết lỗi này không? ➔ Tuyệt đối KHÔNG! OSIV là anti-pattern nguy hiểm làm giữ connection database suốt thời gian render HTTP response, dễ gây cạn kiệt Connection Pool. Cách đúng là dùng DTO và JOIN FETCH ở Repository.'
  },
  {
    id: 'q-24',
    category: 'Database / JPA',
    level: 'Junior',
    question: 'Giải thích 4 cấp độ cô lập giao dịch (Transaction Isolation Levels)?',
    shortAnswer: '1. READ UNCOMMITTED: Cho phép đọc dữ liệu chưa commit (Bị Dirty Read). 2. READ COMMITTED: Chỉ đọc dữ liệu đã commit (Chặn Dirty Read, bị Non-repeatable Read). 3. REPEATABLE READ: Đảm bảo đọc cùng 1 dòng ra cùng giá trị (Chặn Non-repeatable Read, có thể bị Phantom Read). 4. SERIALIZABLE: Tuần tự hóa an toàn nhất nhưng chậm nhất.',
    seniorDeepDive: 'Mặc định: PostgreSQL và Oracle dùng READ COMMITTED; MySQL InnoDB dùng REPEATABLE READ (và dùng Next-Key Lock để chặn luôn cả Phantom Read). Isolation level càng cao thì chi phí khóa càng lớn, throughput của hệ thống càng giảm.',
    trapWarning: 'Dirty Read khác Non-repeatable Read thế nào? ➔ Dirty Read: Đọc dữ liệu của transaction khác chưa commit và sau đó bị rollback. Non-repeatable Read: Đọc 1 dòng 2 lần trong cùng transaction nhưng ra kết quả khác nhau do transaction khác đã sửa và commit ở giữa.'
  },
  {
    id: 'q-25',
    category: 'Database / JPA',
    level: 'Junior',
    question: 'Transaction Propagation: Khác biệt giữa REQUIRED và REQUIRES_NEW?',
    shortAnswer: 'REQUIRED (mặc định): Nếu đã có transaction đang chạy thì tham gia vào; nếu chưa có thì tạo mới. REQUIRES_NEW: Luôn luôn tạm dừng transaction hiện tại và tạo một transaction độc lập mới toanh.',
    seniorDeepDive: 'Trường hợp kinh điển dùng REQUIRES_NEW: Ghi Audit Log (Nhật ký kiểm toán) hoặc trừ lượt thử đăng nhập thất bại. Bạn muốn ghi nhận lịch sử vào DB ngay cả khi nghiệp vụ chính bên ngoài bị lỗi và rollback!',
    trapWarning: 'Nếu method có REQUIRES_NEW ném exception ra ngoài mà method gọi không bắt thì transaction bên ngoài có bị rollback theo không? ➔ Có! Dù là 2 transaction riêng nhưng exception vẫn văng ngược ra làm rollback cả bên ngoài.'
  },

  // ==========================================
  // PHẦN 5: TESTING & LIVE CODING (CÂU 26 - 30)
  // ==========================================
  {
    id: 'q-26',
    category: 'Testing & QA',
    level: 'Intern',
    question: 'Kim tự tháp kiểm thử (Test Pyramid) là gì?',
    shortAnswer: 'Mô hình phân bổ số lượng bài test: Tầng đáy là Unit Tests (chiếm số lượng lớn nhất ~70%, chạy nhanh tính bằng mili-giây). Tầng giữa là Integration Tests (~20%, kiểm tra tương tác giữa các module/DB). Tầng đỉnh là E2E Tests (~10%, chạy trên trình duyệt thực tế, chậm và tốn kém nhất).',
    seniorDeepDive: 'Nếu một dự án có hình "Kem ốc quế ngược" (Toàn test manual E2E mà không có Unit test), chi phí bảo trì sẽ cực lớn và thời gian chạy CI/CD sẽ kéo dài hàng tiếng đồng hồ, làm chậm tiến độ release.',
    trapWarning: 'Có nên mock hết trong Integration Test không? ➔ Không! Integration test sinh ra để kiểm tra sự kết hợp thật (với Database, Context), nếu mock hết thì nó biến thành Unit Test rồi.'
  },
  {
    id: 'q-27',
    category: 'Testing & QA',
    level: 'Fresher',
    question: 'Mockito: Làm thế nào để mock một method void hoặc method ném Exception?',
    shortAnswer: 'Với method trả về giá trị, ta dùng when(mock.method()).thenReturn(val). Với method void hoặc ném exception, ta dùng cú pháp doNothing(), doThrow(Ex.class).when(mock).method().',
    seniorDeepDive: 'Lý do method void không dùng when().thenReturn() được là vì cú pháp Java không cho phép truyền một biểu thức void vào tham số của hàm when().',
    trapWarning: 'Làm thế nào để verify thứ tự gọi các method trong Mockito? ➔ Dùng đối tượng InOrder: InOrder inOrder = inOrder(mockA, mockB); inOrder.verify(mockA).step1(); inOrder.verify(mockB).step2();'
  },
  {
    id: 'q-28',
    category: 'Kỹ Năng & Live Coding',
    level: 'Fresher',
    question: 'Khi phỏng vấn Live Coding gặp bài toán lạ hoặc bị bí thuật toán, bạn xử lý thế nào?',
    shortAnswer: 'Bình tĩnh giao tiếp với Interviewer: 1. Đặt câu hỏi làm rõ đề bài và các trường hợp biên (Edge Cases). 2. Trình bày giải pháp thô (Brute Force) trước để đảm bảo tính đúng đắn. 3. Thảo luận hướng tối ưu (dùng Hash Map, Two Pointers). 4. Nghĩ thành tiếng (Think out loud) để người phỏng vấn hiểu tư duy của mình.',
    seniorDeepDive: 'Người phỏng vấn quan sát cách bạn phản ứng trước áp lực và cách bạn hợp tác làm việc. Một ứng viên ngồi im thin thít 20 phút rồi viết ra code hoàn hảo thường bị nghi ngờ là học vẹt hoặc copy, trong khi ứng viên chủ động giao tiếp và cùng tìm ra giải pháp sẽ được đánh giá rất cao.',
    trapWarning: 'Tuyệt đối không bao giờ cắm đầu vào gõ code ngay khi vừa đọc đề xong! Luôn xác nhận input, output và độ phức tạp mong muốn trước.'
  },
  {
    id: 'q-29',
    category: 'Kỹ Năng & Live Coding',
    level: 'Junior',
    question: 'Khi bạn và Senior Developer bất đồng ý kiến về một giải pháp kỹ thuật, bạn giải quyết thế nào?',
    shortAnswer: 'Dựa trên số liệu và bằng chứng khách quan chứ không dựa trên cái tôi: 1. Lắng nghe và hiểu trọn vẹn lý do của Senior (về vận hành, thời gian release, tính mở rộng). 2. Trình bày phương án của mình kèm số liệu đo lường (Benchmark, độ phức tạp bộ nhớ, chuẩn convention). 3. Nếu vẫn chưa thống nhất, tôn trọng quyết định cuối cùng của Tech Lead để đảm bảo tiến độ dự án.',
    seniorDeepDive: 'Thể hiện phẩm chất "Disagree and Commit" (Không đồng thuận nhưng vẫn cam kết thực hiện hết mình). Đừng để mâu thuẫn kỹ thuật biến thành mâu thuẫn cá nhân làm ảnh hưởng tới văn hóa nhóm.',
    trapWarning: 'Tránh trả lời: "Em là Junior nên em cứ nghe theo Senior cho lành" (Thể hiện sự thụ động) hoặc "Em sẽ cãi tới cùng vì em chắc chắn code em tối ưu hơn" (Thể hiện cái tôi quá lớn).'
  },
  {
    id: 'q-30',
    category: 'Kỹ Năng & Live Coding',
    level: 'Fresher',
    question: 'Kể về một bug khó bạn từng gặp và cách bạn đã điều tra tìm ra nguyên nhân?',
    shortAnswer: 'Trả lời theo mô hình STAR: Nêu bối cảnh hệ thống ➔ Mô tả triệu chứng lỗi (ví dụ: memory leak hoặc thỉnh thoảng mất dữ liệu) ➔ Quá trình điều tra (đọc log stack trace, dùng breakpoint, profiling jconsole, heap dump) ➔ Tìm ra nguyên nhân gốc rễ (Root Cause) ➔ Biện pháp khắc phục và bài học rút ra để không tái phạm.',
    seniorDeepDive: 'Người phỏng vấn muốn kiểm tra tư duy gỡ lỗi (Debugging Skills) của bạn: Bạn có biết đọc log không? Có biết dùng công cụ đo lường không? Hay chỉ biết đoán mò và thêm System.out bừa bãi?',
    trapWarning: 'Đừng kể về các lỗi chính tả ngớ ngẩn (quên chấm phẩy, sai tên biến). Hãy kể về các lỗi liên quan đến logic, concurrency, transaction hoặc lỗi tích hợp bên thứ ba.'
  },

  // ==========================================
  // PHẦN 6: HẠ TẦNG, BẢO MẬT & KỸ NĂNG NÂNG CAO (CÂU 31 - 38)
  // ==========================================
  {
    id: 'q-31',
    category: 'Hạ Tầng & Security',
    level: 'Fresher',
    question: 'Cấu trúc của JSON Web Token (JWT) gồm những gì và Server xác thực thế nào mà không cần query Database?',
    shortAnswer: 'JWT gồm 3 phần nối bằng dấu chấm: Header (thuật toán mã hóa), Payload (thông tin claims: userId, role, exp), và Signature (chữ ký số). Server dùng Secret Key để băm lại Header + Payload và so khớp với Signature đính kèm. Nếu khớp và chưa hết hạn, token hợp lệ 100% mà không cần chạm vào DB.',
    seniorDeepDive: 'JWT bản chất chỉ được Base64Url encode chứ KHÔNG hề được mã hóa bí mật (bất kỳ ai cũng đọc được nội dung trong Payload). Tuyệt đối không bao giờ nhét mật khẩu, số thẻ tín dụng hay dữ liệu nhạy cảm vào Payload. Signature đảm bảo tính toàn vẹn (Integrity): nếu hacker sửa bất kỳ ký tự nào trong Payload, Signature sẽ sai lệch ngay lập tức.',
    trapWarning: 'Điểm yếu chết người của JWT Stateless là gì? ➔ Rất khó thu hồi (revoke) trước khi token hết hạn nếu user bị hack hoặc đổi mật khẩu. Cần kết hợp Refresh Token lưu trong Redis dạng Blacklist/Whitelist để vô hiệu hóa khẩn cấp.'
  },
  {
    id: 'q-32',
    category: 'Spring Boot',
    level: 'Intern',
    question: 'Phân biệt mã phản hồi HTTP: 401 Unauthorized vs 403 Forbidden, và 200 OK vs 201 Created vs 204 No Content?',
    shortAnswer: '401 Unauthorized: Thiếu hoặc sai thông tin xác thực (chưa login, token sai/hết hạn). 403 Forbidden: Đã login thành công nhưng không có quyền hạn (Permission/Role) truy cập tài nguyên. 200 OK: Thành công có payload trả về. 201 Created: Tạo mới thành công (thường kèm header Location). 204 No Content: Xử lý thành công nhưng không có body (thường dùng cho DELETE).',
    seniorDeepDive: 'Khi trả về 201 Created từ API POST, chuẩn RFC khuyến nghị kèm header Location chỉ tới URI của tài nguyên vừa tạo (ví dụ: Location: /api/v1/orders/102). Dùng đúng mã trạng thái HTTP giúp client (Frontend/Mobile) xử lý luồng giao diện mượt mà và giảm thiểu code thừa kiểm tra status string.',
    trapWarning: 'Nhiều lập trình viên nghiệp dư luôn trả về HTTP 200 kèm body {"code": 401, "message": "unauthorized"}! Điều này phá vỡ chuẩn RESTful, khiến các tầng proxy, API gateway (như Kong, NGINX) không thể ghi nhận số liệu metric giám sát chính xác.'
  },
  {
    id: 'q-33',
    category: 'Hạ Tầng & Security',
    level: 'Junior',
    question: 'Mô hình Cache-Aside (Lazy Loading) là gì? Hiện tượng Cache Stampede (Thùng rác rỗng) phòng tránh ra sao?',
    shortAnswer: 'Cache-Aside: Khi đọc, ứng dụng kiểm tra Cache trước; nếu có (Cache Hit) thì trả về ngay; nếu không (Cache Miss) thì query DB, lưu kết quả vào Cache rồi trả về. Khi ghi, cập nhật DB trước rồi XÓA (Evict) key trong Cache. Cache Stampede xảy ra khi 1 key nóng hết hạn cùng lúc hàng ngàn request ùa vào DB, khắc phục bằng Mutex Lock hoặc gia hạn TTL ngẫu nhiên (Jitter).',
    seniorDeepDive: 'Tại sao khi cập nhật DB ta chọn XÓA cache thay vì CẬP NHẬT cache? Vì nếu có 2 luồng ghi đồng thời, luồng 1 ghi DB trước, luồng 2 ghi DB sau, nhưng luồng 1 lại cập nhật Cache sau luồng 2 (do mạng trễ), dẫn đến Cache chứa dữ liệu rác cũ vĩnh viễn! Xóa key giúp tránh hoàn toàn xung đột này.',
    trapWarning: 'Phân biệt Cache Penetration vs Cache Avalanche: Penetration: Hacker liên tục query các ID không hề tồn tại trong hệ thống (DB lẫn Cache đều không có) ➔ Khắc phục bằng Bloom Filter hoặc lưu key rác với TTL ngắn (1-2 phút). Avalanche: Hàng loạt key cache cùng hết hạn tại một thời điểm ➔ Khắc phục bằng cách cộng thêm ngẫu nhiên vài phút (Random TTL Jitter).'
  },
  {
    id: 'q-34',
    category: 'Hạ Tầng & Security',
    level: 'Fresher',
    question: 'Tại sao nên dùng Docker Multi-stage Build khi đóng gói ứng dụng Spring Boot?',
    shortAnswer: 'Để tối ưu dung lượng Image từ hàng GB xuống chỉ còn 100-150MB và nâng cao bảo mật: Stage 1 (Build) dùng image Maven/Gradle đầy đủ để compile và đóng gói file .jar; Stage 2 (Runtime) chỉ dùng image JRE tối giản (như Eclipse Temurin JRE Alpine) và copy file .jar từ Stage 1 sang.',
    seniorDeepDive: 'Multi-stage build loại bỏ toàn bộ mã nguồn nguồn .java, dependencies Maven (.m2 repository), trình biên dịch javac và các công cụ dòng lệnh thừa khỏi môi trường Production. Điều này vừa tăng tốc độ tải image lên Kubernetes, vừa thu hẹp diện tích tấn công (Attack Surface) của hacker.',
    trapWarning: 'Có nên chạy container Java dưới quyền user root không? ➔ Tuyệt đối không! Luôn tạo một user không đặc quyền (ví dụ: RUN addgroup -S appgroup && adduser -S appuser -G appgroup) và khai báo USER appuser trong Dockerfile.'
  },
  {
    id: 'q-35',
    category: 'Kỹ Năng & Live Coding',
    level: 'Fresher',
    question: 'Phân biệt git merge và git rebase? Quy tắc vàng khi nào tuyệt đối KHÔNG được rebase?',
    shortAnswer: 'git merge: Gộp 2 nhánh lại bằng cách tạo ra 1 "merge commit" mới, bảo toàn lịch sử đầy đủ theo đúng trình tự thời gian. git rebase: Viết lại lịch sử bằng cách chuyển gốc nhánh của bạn lên đỉnh của nhánh đích, tạo lịch sử commit thẳng tắp tuyến tính. Quy tắc vàng: TUYỆT ĐỐI KHÔNG rebase trên các nhánh dùng chung (Public/Shared Branches như main, develop).',
    seniorDeepDive: 'Nếu bạn rebase một commit đã được push lên nhánh remote dùng chung, các đồng nghiệp khác kéo về sẽ bị lệch commit hash hoàn toàn và gặp xung đột dây chuyền. Rebase chỉ an toàn trên các nhánh tính năng cá nhân (local feature branches) để gom commit (Squash) cho gọn gàng trước khi tạo Pull Request.',
    trapWarning: 'Khi gặp conflict trong lúc rebase, làm thế nào? ➔ Sửa file conflict, chạy git add <file>, sau đó chạy git rebase --continue (TUYỆT ĐỐI KHÔNG dùng git commit).'
  },
  {
    id: 'q-36',
    category: 'Database / JPA',
    level: 'Junior',
    question: 'Phân biệt Clustered Index và Non-Clustered (Secondary) Index trong Database?',
    shortAnswer: 'Clustered Index: Sắp xếp vật lý thực tế của dữ liệu trên ổ cứng theo thứ tự của index (mỗi bảng chỉ có DUY NHẤT 1 Clustered Index, thường là Khóa chính Primary Key). Non-Clustered Index: Bảng mục lục riêng biệt trỏ tới địa chỉ của dữ liệu hoặc trỏ tới Clustered Key.',
    seniorDeepDive: 'Trong MySQL InnoDB, Primary Key là Clustered Index (B+Tree). Các Secondary Index lưu giá trị của Primary Key tại Node lá. Do đó, khi bạn tìm kiếm bằng Secondary Index mà query lấy cả các cột không có trong index, Database phải thực hiện thao tác "Bookmark Lookup" (tra cứu thêm một lần nữa vào Clustered Index) để lấy toàn bộ dòng dữ liệu.',
    trapWarning: 'Hiện tượng "Covering Index" là gì? ➔ Là khi tất cả các cột được yêu cầu trong câu SELECT đều nằm trọn vẹn trong Non-Clustered Index. Lúc này DB không cần Lookup vào Clustered Table nữa, tốc độ truy vấn tăng vọt!'
  },
  {
    id: 'q-37',
    category: 'Spring Boot',
    level: 'Junior',
    question: 'Spring Security Filter Chain hoạt động như thế nào và JwtAuthenticationFilter được đặt ở vị trí nào?',
    shortAnswer: 'Spring Security hoạt động dựa trên một chuỗi các bộ lọc Servlet (SecurityFilterChain). Mỗi request đi qua lần lượt các Filter trước khi tới được Controller. JwtAuthenticationFilter do ta tự viết thường được đặt TRƯỚC UsernamePasswordAuthenticationFilter (dùng .addFilterBefore()).',
    seniorDeepDive: 'Trong JwtAuthenticationFilter (kế thừa OncePerRequestFilter): 1. Lấy header Authorization: Bearer <token>. 2. Verify chữ ký JWT. 3. Trích xuất username và roles. 4. Tạo đối tượng UsernamePasswordAuthenticationToken và nạp vào SecurityContextHolder.getContext().setAuthentication(auth). Khi đó Spring coi như người dùng đã đăng nhập hợp lệ.',
    trapWarning: 'Tại sao phải dùng OncePerRequestFilter thay vì GenericFilterBean? ➔ OncePerRequestFilter đảm bảo filter chỉ thực thi DUY NHẤT 1 lần cho mỗi request, kể cả khi request được dispatch nội bộ (như forward sang trang xử lý lỗi /error).'
  },
  {
    id: 'q-38',
    category: 'Core Java',
    level: 'Fresher',
    question: 'Java 8 Stream: Khác biệt giữa Intermediate Operation và Terminal Operation? Cơ chế Lazy Evaluation hoạt động ra sao?',
    shortAnswer: 'Intermediate Operation (filter, map, sorted, limit): Trả về một Stream mới và KHÔNG thực thi ngay lập tức (Lazy). Terminal Operation (collect, count, forEach, findFirst, reduce): Kích hoạt toàn bộ luồng xử lý và kết thúc Stream, trả về kết quả cuối cùng hoặc void.',
    seniorDeepDive: 'Nhờ Lazy Evaluation, Stream tối ưu hóa hiệu năng bằng Short-Circuiting và Loop Fusion: ví dụ stream.filter(...).map(...).findFirst(), Stream chỉ duyệt từng phần tử qua cả filter và map, khi tìm thấy phần tử thỏa mãn đầu tiên thì DỪNG NGAY LẬP TỨC chứ không duyệt hết toàn bộ danh sách 1 triệu phần tử như vòng lặp for truyền thống.',
    trapWarning: 'Stream trong Java có thể dùng lại (reuse) lần thứ 2 được không? ➔ Tuyệt đối KHÔNG! Khi một Terminal Operation đã chạy xong, Stream đã bị đóng (consumed). Nếu cố tình gọi tiếp thao tác khác trên Stream đó, JVM sẽ ném ra IllegalStateException: "stream has already been operated upon or closed".'
  },
  {
    id: 'q-39',
    category: 'Concurrency & JVM',
    level: 'Junior',
    question: 'Virtual Threads (Project Loom trong Java 21) hoạt động như thế nào và khác Platform Threads (OS Threads) ra sao?',
    shortAnswer: 'Platform Thread ánh xạ 1:1 với kernel thread của OS, tốn ~1MB bộ nhớ stack và đắt đỏ khi context switch. Virtual Thread là các green thread do JVM quản lý trên user-space, cực kỳ nhẹ (~vài KB), cho phép tạo hàng triệu luồng đồng thời mà không nghẽn OS.',
    seniorDeepDive: 'Khi một Virtual Thread gặp I/O chặn (như đọc DB, gọi HTTP), JVM "unmount" (tháo rời) nó khỏi Carrier Thread (ForkJoinPool worker) và chuyển Carrier Thread đó sang phục vụ Virtual Thread khác. Khi I/O hoàn tất, Virtual Thread được "mount" trở lại. Nhờ đó giữ được mô hình đồng bộ dễ đọc (thread-per-request) mà vẫn đạt thông lượng (throughput) ngang ngửa WebFlux phản ứng!',
    trapWarning: 'Có nên dùng Thread Pool (Executors.newFixedThreadPool) cho Virtual Threads không? ➔ Tuyệt đối KHÔNG! Virtual Threads sinh ra để tạo và vứt đi (ephemeral), pool hóa chúng là anti-pattern. Dùng Executors.newVirtualThreadPerTaskExecutor(). Cẩn trọng với hiện tượng Pinning Thread khi dùng synchronized block cũ (hãy đổi sang ReentrantLock).'
  },
  {
    id: 'q-40',
    category: 'Database / JPA',
    level: 'Junior',
    question: 'Phân biệt Optimistic Locking (Khóa lạc quan) và Pessimistic Locking (Khóa bi quan)? Khi nào dùng loại nào?',
    shortAnswer: 'Optimistic Locking: Giả định ít khi xảy ra xung đột, dùng cột version số nguyên để kiểm tra lúc commit; nếu version bị thay đổi bởi luồng khác thì ném OptimisticLockException. Pessimistic Locking: Khóa chặt dòng dữ liệu ngay từ lúc đọc (SELECT ... FOR UPDATE), bắt các luồng khác phải xếp hàng chờ.',
    seniorDeepDive: 'Optimistic Locking không khóa database nên thông lượng cực cao, phù hợp cho hệ thống có tần suất đọc nhiều hơn ghi (tỉ lệ 9:1 như cập nhật thông tin user, sửa bài viết). Pessimistic Locking bắt buộc dùng khi tần suất tranh chấp cực cao và hậu quả sai sót rất nghiêm trọng (như giật vé xem phim, flash-sale trừ tồn kho còn đúng 1 sản phẩm cuối cùng, giao dịch trừ số dư ví điện tử).',
    trapWarning: 'Làm thế nào để xử lý khi dính OptimisticLockException? ➔ Bắt exception này và cấu hình cơ chế tự động thử lại (Retry Pattern với Spring Retry @Retryable) tối đa 3-5 lần trước khi báo lỗi cho người dùng.'
  },
  {
    id: 'q-41',
    category: 'Spring Boot',
    level: 'Junior',
    question: 'Vòng đời (Lifecycle) của một Spring Bean diễn ra như thế nào? PostConstruct và PreDestroy chạy lúc nào?',
    shortAnswer: '1. Đọc BeanDefinition ➔ 2. Gọi Constructor khởi tạo instance ➔ 3. Inject dependencies (Setter/Field/Constructor) ➔ 4. Các BeanPostProcessor (beforeInit) ➔ 5. @PostConstruct / afterPropertiesSet() ➔ 6. Các BeanPostProcessor (afterInit - tạo Dynamic Proxy cho @Transactional) ➔ 7. Bean sẵn sàng hoạt động ➔ 8. Khi ứng dụng tắt: @PreDestroy / destroy().',
    seniorDeepDive: 'Cực kỳ lưu ý ở bước BeanPostProcessor afterInitialization: Đây là nơi Spring tạo ra CGLIB hoặc JDK Dynamic Proxy bao quanh bean của bạn để xử lý AOP (@Transactional, @Async, @Cacheable). Nếu bạn gọi một method @Transactional từ bên trong chính hàm @PostConstruct, transaction sẽ KHÔNG hoạt động vì lúc đó proxy chưa hoàn tất thiết lập!',
    trapWarning: 'Hỏi về Bean Scopes: "Singleton bean inject vào Prototype bean thì có vấn đề gì?" ➔ Ngược lại: Prototype bean inject vào Singleton bean chỉ được khởi tạo DUY NHẤT 1 lần lúc startup (mất tính chất prototype)! Muốn mỗi lần gọi sinh instance mới, phải dùng @Lookup method injection hoặc ObjectProvider<T>.'
  },
  {
    id: 'q-42',
    category: 'Hạ Tầng & Security',
    level: 'Junior',
    question: 'Lỗ hổng CSRF (Cross-Site Request Forgery) và XSS (Cross-Site Scripting) khác nhau thế nào? Cách phòng chống chuẩn Production?',
    shortAnswer: 'XSS: Kẻ tấn công tiêm mã JavaScript độc hại vào trang web để đánh cắp token hoặc dữ liệu người dùng. CSRF: Kẻ tấn công lừa trình duyệt của người dùng gửi một request hợp lệ kèm Cookie đã đăng nhập tới server mà người dùng không hề hay biết.',
    seniorDeepDive: 'Chống XSS: Luôn escape HTML ở output, dùng Content Security Policy (CSP) header, và lưu JWT vào Cookie HttpOnly (chặn JS đọc). Chống CSRF: Khi dùng Cookie auth, bắt buộc set cờ SameSite=Strict/Lax trên Cookie, kết hợp CSRF Token (Synchronizer Token Pattern) hoặc chuyển sang dùng Bearer Token trong header Authorization (CSRF không thể tự động gắn custom header).',
    trapWarning: 'Tại sao API RESTful thuần túy dùng JWT trong header Authorization lại có thể tắt csrf().disable()? ➔ Vì kẻ tấn công trên trang web độc hại của họ không thể ép trình duyệt tự động gửi header Authorization: Bearer <token> của domain khác sang server của bạn (khác với Cookie tự động bị đính kèm).'
  },
  {
    id: 'q-43',
    category: 'Core Java',
    level: 'Fresher',
    question: 'Từ khóa volatile trong Java có tác dụng gì? Nó có đảm bảo tính Thread-Safe cho phép toán cộng dồn (count++) không?',
    shortAnswer: 'volatile đảm bảo tính nhìn thấy (Visibility) giữa các luồng: biến luôn được đọc và ghi trực tiếp từ RAM chính chứ không lưu trong CPU Cache riêng của từng core, đồng thời ngăn chặn trình biên dịch đổi thứ tự lệnh (Instruction Reordering). Tuy nhiên, volatile KHÔNG đảm bảo tính nguyên tử (Atomicity), do đó count++ VẪN BỊ RACE CONDITION!',
    seniorDeepDive: 'Phép toán count++ thực chất bao gồm 3 thao tác bytecode riêng biệt: 1. Đọc count từ RAM vào thanh ghi CPU ➔ 2. Tăng giá trị lên 1 ➔ 3. Ghi giá trị mới trở lại RAM. Nếu 2 luồng cùng đọc giá trị 10 cùng lúc, cả 2 sẽ cùng tính ra 11 và ghi đè nhau, kết quả bị mất mát dữ liệu. Để an toàn tính đếm, phải dùng AtomicInteger (sử dụng lệnh phần cứng CAS - Compare-And-Swap) hoặc synchronized.',
    trapWarning: 'Volatile thường được áp dụng trong bài toán thực tế nào? ➔ Dùng cho cờ dừng luồng (boolean running flag) hoặc trong Double-Checked Locking khi cài đặt mẫu Singleton an toàn đa luồng.'
  },
  {
    id: 'q-44',
    category: 'Hạ Tầng & Security',
    level: 'Junior',
    question: 'Outbox Pattern trong Microservices giải quyết bài toán gì? Tại sao không nên vừa ghi DB vừa gửi Kafka trong cùng một hàm?',
    shortAnswer: 'Giải quyết bài toán "Dual Write" (Ghi kép): Đảm bảo tính nhất quán dữ liệu giữa việc lưu bản ghi vào Database và bắn thông điệp sang Kafka/RabbitMQ mà không thể dùng 2PC (Two-Phase Commit) chậm chạp.',
    seniorDeepDive: 'Nếu bạn ghi DB thành công nhưng server bị sập điện ngay trước khi kịp gửi Kafka ➔ Dữ liệu DB có nhưng bên ngoài không nhận được event. Ngược lại, nếu gửi Kafka trước rồi ghi DB sau, nhưng DB bị lỗi rollback ➔ Event đã bắn đi trong khi DB không có dữ liệu (Ghost Event). Outbox Pattern: Lưu event vào một bảng outbox_events nằm trong CÙNG TRANSACTION với bảng nghiệp vụ (ACID bảo toàn 100%). Một tiến trình Debezium (CDC - Change Data Capture) hoặc Worker quét bảng outbox này và gửi sang Kafka an toàn.',
    trapWarning: 'Làm thế nào để đảm bảo Worker outbox không bắn tin nhắn trùng lặp? ➔ Hệ thống phân tán luôn tuân thủ nguyên tắc "At-least-once delivery" (giao tin nhắn ít nhất 1 lần). Do đó Consumer phía nhận bắt buộc phải thiết kế tính Bất Khả Biến (Idempotent Consumer).'
  },
  {
    id: 'q-45',
    category: 'Testing & QA',
    level: 'Junior',
    question: 'Tại sao không nên dùng Mockito để mock toàn bộ mọi thứ trong Integration Test? Khi nào dùng MockMvc vs TestRestTemplate vs WebTestClient?',
    shortAnswer: 'Mock quá nhiều biến bài test thành "tự biên tự diễn": Code của bạn pass vì bạn tự định nghĩa hành vi giả, nhưng khi ghép nối thật với DB hoặc mạng thì toang. MockMvc kiểm tra Controller trong Spring Context không bật port mạng; TestRestTemplate mở port mạng thật kiểm tra toàn bộ server Tomcat; WebTestClient dùng cho WebFlux non-blocking.',
    seniorDeepDive: 'Quy tắc kim tự tháp kiểm thử: Mockito chỉ nên dùng cho Unit Test ở tầng Service để cô lập logic nghiệp vụ. Ở tầng Integration Test, hãy dùng Testcontainers để nạp Database PostgreSQL/MySQL và Redis thật, chỉ mock các dịch vụ thanh toán bên ngoài (bằng WireMock) mà ta không thể kiểm soát sandbox.',
    trapWarning: 'Sự khác biệt giữa @Mock và @MockBean trong Spring Test? ➔ @Mock là của Mockito thuần túy, khởi tạo bù nhìn cực nhanh; @MockBean là của Spring Boot Test, nó thay thế bean thật trong ApplicationContext của Spring bằng một con mock và làm ApplicationContext bị bẩn (Dirty Context), khiến việc chạy test suite bị chậm đi nếu lạm dụng.'
  }
];

