export interface DailyMicroChallenge {
  id: string;
  dayLabel: string;
  topic: 'Java Core' | 'Spring Boot' | 'SQL & DB' | 'Network';
  title: string;
  codeOrScenario: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  takeaway: string;
}

export interface CvProjectTemplate {
  id: string;
  projectType: string;
  icon: string;
  weakBullet: string;
  upgradedBullets: {
    focus: string;
    badgeColor: string;
    xyzText: string;
    keywords: string[];
  }[];
}

export interface LevelCompanyProfile {
  level: 'Intern' | 'Fresher' | 'Junior' | 'Middle';
  companyType: 'Outsourcing' | 'Product' | 'Fintech' | 'BigTech';
  companyTypeLabel: string;
  salaryRangeVnd: string;
  interviewRounds: string;
  mustHaveSkills: string[];
  bonusDifferentiators: string[];
  nextLevelRoadmap: string[];
}

export interface IncidentStage {
  stageNumber: number;
  stageTitle: string;
  situationText: string;
  choices: {
    id: string;
    actionText: string;
    isOptimal: boolean;
    hpDelta: number;
    outcomeFeedback: string;
  }[];
}

export interface IncidentScenario {
  id: string;
  title: string;
  timeTag: string;
  severity: 'SEV-1 (Nghiêm trọng)' | 'SEV-2 (Cảnh báo cao)';
  alertBanner: string;
  stages: IncidentStage[];
  postMortemLesson: string;
}

export interface CramFlashcard {
  id: string;
  category: 'Java Core' | 'Spring Boot' | 'SQL & DB' | 'Network';
  question: string;
  threeGoldenKeywords: [string, string, string];
  oneLinerPunchline: string;
}

// ============================================================================
// 1. NHÓM 1: THỬ THÁCH 60 GIÂY MỖI NGÀY (DAILY MICRO-CHALLENGES)
// ============================================================================
export const DAILY_MICRO_CHALLENGES: DailyMicroChallenge[] = [
  {
    id: 'daily-1',
    dayLabel: 'Thứ Hai • Java Memory Puzzle',
    topic: 'Java Core',
    title: 'Bẫy so sánh Integer Wrapper Cache',
    codeOrScenario: `Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println((a == b) + " - " + (c == d));`,
    question: 'Đoạn code trên khi chạy trên JVM mặc định sẽ in ra kết quả gì?',
    options: [
      {
        id: 'opt-1',
        text: 'true - false',
        isCorrect: true,
        explanation: 'Chính xác! JVM cache sẵn các đối tượng Integer trong khoảng [-128, 127] khi autoboxing nên a và b trỏ cùng 1 ô nhớ (true). Với 128, JVM tạo 2 object mới trên Heap nên c == d trả về false.'
      },
      {
        id: 'opt-2',
        text: 'true - true',
        isCorrect: false,
        explanation: 'Sai! Toán tử == trên kiểu đối tượng (Integer) so sánh địa chỉ tham chiếu, và Integer Cache chỉ lưu từ -128 đến 127.'
      },
      {
        id: 'opt-3',
        text: 'false - false',
        isCorrect: false,
        explanation: 'Sai! Giá trị 127 nằm trong vùng IntegerCache [-128, 127] nên a và b dùng chung một instance.'
      }
    ],
    takeaway: 'Luôn dùng .equals() hoặc Objects.equals() khi so sánh các kiểu Wrapper (Integer, Long) thay vì toán tử ==.'
  },
  {
    id: 'daily-2',
    dayLabel: 'Thứ Ba • Spring Boot Trap',
    topic: 'Spring Boot',
    title: 'Bẫy Checked Exception trong @Transactional',
    codeOrScenario: `@Transactional
public void transferMoney(Long fromId, Long toId, BigDecimal amount) throws IOException {
    accountRepo.debit(fromId, amount);
    // Gửi biên lai bị lỗi I/O và ném ra IOException (Checked Exception):
    receiptService.exportPdfFile(fromId);
}`,
    question: 'Khi hàm exportPdfFile() ném ra IOException, số tiền đã trừ ở dòng trên có được tự động Rollback không?',
    options: [
      {
        id: 'opt-1',
        text: 'KHÔNG rollback! Vì mặc định @Transactional chỉ rollback với RuntimeException và Error.',
        isCorrect: true,
        explanation: 'Chuẩn xác! IOException là Checked Exception nên mặc định Spring vẫn COMMIT giao dịch trừ tiền. Muốn rollback mọi lỗi, phải khai báo @Transactional(rollbackFor = Exception.class).'
      },
      {
        id: 'opt-2',
        text: 'CÓ rollback tự động vì mọi Exception trong @Transactional đều được rollback.',
        isCorrect: false,
        explanation: 'Cạm bẫy rất phổ biến! Mặc định Spring chỉ rollback Unchecked Exception (RuntimeException).'
      },
      {
        id: 'opt-3',
        text: 'Code không thể biên dịch được vì @Transactional cấm dùng throws IOException.',
        isCorrect: false,
        explanation: 'Sai, code biên dịch hoàn toàn bình thường nhưng hành vi commit/rollback sẽ gây mất tiền oan nếu thiếu rollbackFor.'
      }
    ],
    takeaway: 'Luôn khai báo rõ @Transactional(rollbackFor = Exception.class) trong các hàm nghiệp vụ quan trọng!'
  },
  {
    id: 'daily-3',
    dayLabel: 'Thứ Tư • SQL Performance',
    topic: 'SQL & DB',
    title: 'Hàm bọc quanh cột làm "mù" B-Tree Index',
    codeOrScenario: `-- Đã có B-Tree Index trên cột created_at:
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Truy vấn thống kê đơn hàng năm 2026:
SELECT COUNT(*) FROM orders WHERE YEAR(created_at) = 2026;`,
    question: 'Tại sao truy vấn trên vẫn chạy rất chậm (Full Table Scan) dù đã đánh Index trên cột created_at?',
    options: [
      {
        id: 'opt-1',
        text: 'Vì bọc hàm YEAR(created_at) lên cột khiến DB phải tính giá trị hàm cho từng dòng, làm vô hiệu hóa B-Tree Index.',
        isCorrect: true,
        explanation: 'Chính xác 100%! B-Tree lưu giá trị gốc của created_at. Khi bọc hàm YEAR(), DB không thể tra cứu cây B-Tree. Hãy viết lại thành: WHERE created_at >= "2026-01-01" AND created_at < "2027-01-01".'
      },
      {
        id: 'opt-2',
        text: 'Vì hàm COUNT(*) không bao giờ dùng được với Index.',
        isCorrect: false,
        explanation: 'Sai! COUNT(*) tận dụng Covering Index cực kỳ nhanh nếu mệnh đề WHERE là SARGable (không bọc hàm lên cột).'
      },
      {
        id: 'opt-3',
        text: 'Vì kiểu DATETIME không thể đánh được B-Tree Index.',
        isCorrect: false,
        explanation: 'Sai! DATETIME/TIMESTAMP rất phù hợp với B-Tree Index cho các truy vấn khoảng (Range Scan).'
      }
    ],
    takeaway: 'Quy tắc SARGable: Không bao giờ bọc hàm hoặc phép toán ở vế trái của cột được đánh Index trong mệnh đề WHERE.'
  },
  {
    id: 'daily-4',
    dayLabel: 'Thứ Năm • API & Security',
    topic: 'Network',
    title: 'Phân biệt nhanh HTTP 401 vs HTTP 403',
    codeOrScenario: `User "Nhân viên kho" đã đăng nhập hợp lệ (gửi kèm JWT hoàn toàn đúng hạn).
User này bấm gọi API: DELETE /api/v1/admin/users/99 (chỉ dành cho role ADMIN).`,
    question: 'Backend chuẩn RESTful phải trả về HTTP Status Code nào trong tình huống này?',
    options: [
      {
        id: 'opt-1',
        text: '403 Forbidden (Đã xác thực danh tính nhưng không đủ quyền hạn Authorization).',
        isCorrect: true,
        explanation: 'Chính xác! 401 là chưa biết bạn là ai (chưa đăng nhập / token hết hạn). Còn khi đã biết rõ bạn là "Nhân viên kho" nhưng bạn không có quyền ADMIN thì phải trả về 403 Forbidden.'
      },
      {
        id: 'opt-2',
        text: '401 Unauthorized (Không có quyền).',
        isCorrect: false,
        explanation: 'Sai! Dù tên chữ là Unauthorized nhưng trong chuẩn RFC HTTP, 401 nghĩa là Unauthenticated (chưa xác thực danh tính).'
      },
      {
        id: 'opt-3',
        text: '500 Internal Server Error.',
        isCorrect: false,
        explanation: 'Sai! Lỗi từ phía quyền của Client tuyệt đối không được trả về 5xx.'
      }
    ],
    takeaway: 'Chưa đăng nhập / sai Token ➔ 401. Đã đăng nhập nhưng thiếu Role/Permission ➔ 403.'
  },
  {
    id: 'daily-5',
    dayLabel: 'Thứ Sáu • Concurrency Puzzle',
    topic: 'Java Core',
    title: 'Biến volatile có thay thế được synchronized khi tăng biến đếm?',
    codeOrScenario: `public class Counter {
    private volatile int count = 0;
    public void increment() {
        count++; // 10 luồng cùng gọi hàm này 1000 lần
    }
}`,
    question: 'Sau khi 10 luồng cùng chạy xong (mỗi luồng gọi increment 1000 lần), giá trị count có luôn bằng 10.000 không?',
    options: [
      {
        id: 'opt-1',
        text: 'KHÔNG! Thường nhỏ hơn 10.000 vì volatile chỉ đảm bảo Visibility chứ không đảm bảo tính nguyên tử (Atomicity) cho phép count++.',
        isCorrect: true,
        explanation: 'Xuất sắc! Phép count++ gồm 3 bước (Đọc -> Cộng 1 -> Ghi). Hai luồng có thể cùng đọc giá trị 5 và cùng ghi đè 6. Phải dùng AtomicInteger (CAS) hoặc synchronized.'
      },
      {
        id: 'opt-2',
        text: 'CÓ, luôn bằng 10.000 vì đã có từ khóa volatile chống xung đột luồng.',
        isCorrect: false,
        explanation: 'Sai lầm kinh điển! volatile không khóa luồng và không gom 3 bước của count++ thành 1 thao tác nguyên tử.'
      },
      {
        id: 'opt-3',
        text: 'Chương trình sẽ bị treo (Deadlock) ngay lập tức.',
        isCorrect: false,
        explanation: 'Sai, không có lock nào được giữ nên không xảy ra Deadlock, mà xảy ra Race Condition (Lost Update).'
      }
    ],
    takeaway: 'Cần cờ trạng thái boolean (1 luồng ghi, nhiều luồng đọc) ➔ dùng volatile. Cần bộ đếm đa luồng ➔ dùng AtomicInteger / LongAdder.'
  }
];

// ============================================================================
// 2. NHÓM 2A: BÁC SĨ SỬA CV THỰC CHIẾN (GOOGLE XYZ BULLET UPGRADER)
// ============================================================================
export const CV_PROJECT_TEMPLATES: CvProjectTemplate[] = [
  {
    id: 'cv-ecommerce',
    projectType: '🛒 Web Bán Hàng / E-Commerce',
    icon: '🛒',
    weakBullet: 'Làm website bán hàng bằng Java Spring Boot, MySQL, có chức năng giỏ hàng, đặt hàng và tìm kiếm sản phẩm.',
    upgradedBullets: [
      {
        focus: 'Chống bán lố (Concurrency & Locking)',
        badgeColor: '#10b981',
        xyzText: 'Thiết kế luồng đặt hàng Flash Sale bằng Spring Boot & JPA, áp dụng Pessimistic Locking (SELECT ... FOR UPDATE) và Atomic Update giúp loại bỏ 100% lỗi bán vượt tồn kho (Overselling) khi thử tải 200 requests đồng thời với JMeter.',
        keywords: ['Spring Boot', 'Pessimistic Locking', 'Concurrency', 'JMeter']
      },
      {
        focus: 'Tối ưu Tìm kiếm & Database Index',
        badgeColor: '#0ea5e9',
        xyzText: 'Tối ưu hóa API tìm kiếm và lọc danh mục trên bảng 500.000 sản phẩm bằng cách thiết kế B-Tree Composite Index và xử lý triệt để lỗi N+1 Query qua @EntityGraph, giúp giảm thời gian phản hồi trung bình từ 1.8 giây xuống 95ms.',
        keywords: ['B-Tree Composite Index', 'N+1 Query', '@EntityGraph', 'MySQL EXPLAIN']
      },
      {
        focus: 'Caching & Thanh toán an toàn',
        badgeColor: '#8b5cf6',
        xyzText: 'Tích hợp Redis theo mô hình Cache-Aside cho trang chi tiết sản phẩm (đạt tỷ lệ Cache Hit 88%) và áp dụng cơ chế Idempotency-Key cho API thanh toán nhằm ngăn chặn lỗi trừ tiền trùng lặp khi mạng chập chờn.',
        keywords: ['Redis Cache-Aside', 'Idempotency-Key', 'RESTful API']
      }
    ]
  },
  {
    id: 'cv-booking',
    projectType: '🎟️ Hệ Thống Đặt Vé Xem Phim / Đặt Phòng / Đặt Lịch',
    icon: '🎟️',
    weakBullet: 'Xây dựng hệ thống đặt vé xem phim online, cho phép người dùng chọn ghế và thanh toán.',
    upgradedBullets: [
      {
        focus: 'Khóa ghế tạm thời (Distributed Lock & TTL)',
        badgeColor: '#10b981',
        xyzText: 'Giải quyết bài toán 2 khách hàng bấm chọn cùng một ghế cùng lúc bằng cơ chế giữ chỗ tạm thời trên Redis (SETNX với TTL 10 phút) kết hợp Unique Constraint dưới PostgreSQL, đảm bảo 0% xung đột dữ liệu.',
        keywords: ['Redis Distributed Lock', 'SETNX', 'TTL', 'PostgreSQL']
      },
      {
        focus: 'Xử lý bất đồng bộ & Tự động nhả ghế',
        badgeColor: '#0ea5e9',
        xyzText: 'Triển khai tiến trình thu hồi ghế quá hạn thanh toán tự động và gửi vé QR Code qua Email bất đồng bộ bằng @Async ThreadPoolExecutor / RabbitMQ, giúp giảm thời gian chờ của API đặt vé từ 3.2s xuống 180ms.',
        keywords: ['Async ThreadPool', 'Message Queue', 'Background Job']
      },
      {
        focus: 'Bảo mật & Kiểm soát truy cập',
        badgeColor: '#8b5cf6',
        xyzText: 'Xây dựng tầng xác thực Stateless với Spring Security & JWT (Access Token 15 phút + Refresh Token Rotation trong Redis Blacklist) và chuẩn hóa phản hồi lỗi toàn cục theo RFC 7807 (@RestControllerAdvice).',
        keywords: ['Spring Security', 'JWT Rotation', 'Redis Blacklist', 'RFC 7807']
      }
    ]
  },
  {
    id: 'cv-library-erp',
    projectType: '📚 Quản Lý Thư Viện / Sinh Viên / Nhân Sự (CRUD / ERP)',
    icon: '📚',
    weakBullet: 'Viết phần mềm quản lý thư viện / sinh viên có thêm sửa xóa, phân quyền và xuất báo cáo Excel.',
    upgradedBullets: [
      {
        focus: 'Phân trang dữ liệu lớn & Tối ưu Báo cáo',
        badgeColor: '#10b981',
        xyzText: 'Thay thế phân trang OFFSET truyền thống bằng Keyset/Cursor Pagination và sử dụng DTO Projection cho API tra cứu lịch sử mượn trả (200.000 bản ghi), giảm 75% dung lượng RAM tiêu thụ và giữ độ trễ ổn định dưới 60ms.',
        keywords: ['Keyset Pagination', 'DTO Projection', 'Memory Optimization']
      },
      {
        focus: 'Phân quyền RBAC & Audit Trail',
        badgeColor: '#0ea5e9',
        xyzText: 'Thiết kế mô hình phân quyền động Role-Based Access Control (RBAC) với Spring Security Method Security (@PreAuthorize) và tự động ghi vết lịch sử thao tác dữ liệu qua Spring Data Envers / Auditing.',
        keywords: ['RBAC', '@PreAuthorize', 'Audit Logging', 'Spring Security']
      },
      {
        focus: 'Kiểm thử tự động & CI/CD',
        badgeColor: '#8b5cf6',
        xyzText: 'Viết hơn 45 bài kiểm thử tự động (Unit Test với JUnit 5/Mockito và Integration Test với Testcontainers) đạt 82% độ phủ ở tầng Service, tích hợp GitHub Actions tự động kiểm tra trước mỗi Pull Request.',
        keywords: ['JUnit 5', 'Mockito', 'Testcontainers', 'GitHub Actions CI']
      }
    ]
  },
  {
    id: 'cv-chat-social',
    projectType: '💬 Ứng Dụng Chat Real-time / Mạng Xã Hội / Blog',
    icon: '💬',
    weakBullet: 'Làm ứng dụng nhắn tin real-time và đăng bài viết bằng Spring Boot và WebSocket.',
    upgradedBullets: [
      {
        focus: 'Kiến trúc Real-time & WebSocket',
        badgeColor: '#10b981',
        xyzText: 'Xây dựng hệ thống nhắn tin và thông báo thời gian thực bằng Spring WebSocket (STOMP protocol) kết hợp cơ chế Heartbeat & Reconnection, phục vụ mượt mà 300 kết nối đồng thời với độ trễ tin nhắn dưới 50ms.',
        keywords: ['Spring WebSocket', 'STOMP', 'Real-time Messaging']
      },
      {
        focus: 'Tối ưu Newsfeed & Rate Limiting',
        badgeColor: '#0ea5e9',
        xyzText: 'Tối ưu luồng tải bảng tin (Newsfeed) bằng bộ nhớ đệm Redis Sorted Set (ZSET) và triển khai bộ giới hạn tần suất gọi API (Token Bucket Rate Limiter) giúp chặn đứng các đợt spam bình luận.',
        keywords: ['Redis Sorted Set', 'Token Bucket', 'Rate Limiting']
      },
      {
        focus: 'Lưu trữ Media & Bảo mật',
        badgeColor: '#8b5cf6',
        xyzText: 'Tích hợp luồng tải ảnh trực tiếp lên Cloud Storage thông qua Pre-signed URL giúp giải phóng 90% băng thông I/O cho máy chủ Backend, đồng thời cấu hình Cookie HttpOnly/SameSite chống tấn công XSS & CSRF.',
        keywords: ['Pre-signed URL', 'Cloud Storage', 'XSS/CSRF Protection']
      }
    ]
  }
];

/**
 * Transforms a raw student project description into a structured Google XYZ bullet point.
 */
export function upgradeCustomCvBullet(rawDescription: string, focusArea: 'performance' | 'concurrency' | 'reliability'): string {
  const cleaned = (rawDescription || '').trim().replace(/\.$/, '') || 'phát triển các API nghiệp vụ bằng Java Spring Boot';
  if (focusArea === 'performance') {
    return `Phát triển và tối ưu hóa mô-đun "${cleaned}" bằng Java Spring Boot, loại bỏ triệt để lỗi N+1 Query thông qua JOIN FETCH / DTO Projection và thiết kế B-Tree Composite Index, giúp giảm thời gian phản hồi API từ ~1.4s xuống dưới 90ms.`;
  }
  if (focusArea === 'concurrency') {
    return `Xây dựng luồng xử lý "${cleaned}" đảm bảo an toàn dữ liệu dưới tải cao bằng cách áp dụng quản lý giao dịch @Transactional(rollbackFor = Exception.class), cơ chế khóa Optimistic/Pessimistic Locking và Idempotency-Key chống trùng lặp.`;
  }
  return `Thiết kế kiến trúc tầng sạch sẽ cho "${cleaned}" theo chuẩn RESTful API, tích hợp xác thực bảo mật JWT + Redis Cache-Aside và viết bộ Unit Test (JUnit 5 & Mockito) đạt độ phủ >80% nhằm ngăn ngừa lỗi hồi quy khi triển khai.`;
}

// ============================================================================
// 3. NHÓM 2B: BẢN ĐỒ KỸ NĂNG & KHUNG ĐÃI NGỘ THỊ TRƯỜNG
// ============================================================================
export const CAREER_LEVEL_PROFILES: LevelCompanyProfile[] = [
  {
    level: 'Intern',
    companyType: 'Outsourcing',
    companyTypeLabel: 'Công ty Outsourcing / Global SI',
    salaryRangeVnd: '2.000.000 – 5.000.000 VNĐ / tháng (Hỗ trợ thực tập)',
    interviewRounds: '1 vòng Test Java/SQL trắc nghiệm + 1 vòng Phỏng vấn Mentor (30-45 phút)',
    mustHaveSkills: [
      'Nắm chắc 4 tính chất OOP, phân biệt Abstract Class vs Interface, Overloading vs Overriding',
      'Thao tác cơ bản với ArrayList, HashMap và viết được câu lệnh SQL SELECT, JOIN, GROUP BY',
      'Biết sử dụng Git cơ bản (clone, checkout, commit, push) và hiểu mô hình MVC trong Spring Boot'
    ],
    bonusDifferentiators: [
      'Có thái độ cầu thị, giao tiếp tiếng Anh đọc hiểu tài liệu tốt (hoặc có chứng chỉ TOEIC/JLPT)',
      'Hoàn thành 1 đồ án CRUD Web hoàn chỉnh có phân trang và validate dữ liệu đầu vào'
    ],
    nextLevelRoadmap: [
      'Tham gia khóa OJT (On-the-Job Training), rèn luyện Coding Convention và quy trình Scrum/Agile',
      'Nắm vững JPA/Hibernate và cách viết Unit Test chuẩn để chuyển lên Fresher chính thức'
    ]
  },
  {
    level: 'Intern',
    companyType: 'Product',
    companyTypeLabel: 'Công ty Product / Công nghệ',
    salaryRangeVnd: '3.000.000 – 8.000.000 VNĐ / tháng (Trợ cấp)',
    interviewRounds: '1 vòng Test tư duy/SQL + 1 vòng Phỏng vấn Kỹ thuật nền tảng (45 phút)',
    mustHaveSkills: [
      'Nắm chắc bản chất Java Core: OOP, Stack vs Heap, Collections (ArrayList, HashMap), equals/hashCode',
      'Viết được câu lệnh SQL: INNER/LEFT JOIN, GROUP BY, HAVING và hiểu khái niệm khóa chính/khóa ngoại',
      'Hiểu luồng HTTP Request/Response, các method GET/POST/PUT/DELETE và cách dùng Git cơ bản'
    ],
    bonusDifferentiators: [
      'Có 1 dự án cá nhân tự code (không chép y nguyên tutorial) và giải thích được từng dòng code mình viết',
      'Biết viết Unit Test cơ bản bằng JUnit 5 và biết chạy Docker Compose dựng MySQL/PostgreSQL'
    ],
    nextLevelRoadmap: [
      'Hoàn thiện đồ án có áp dụng Spring Boot + JPA + JWT chuẩn chỉnh',
      'Học cách đọc log lỗi (Stacktrace) và tự debug bằng Breakpoint trong IntelliJ IDEA',
      'Nắm vững cơ chế IoC/DI và @Transactional để bước lên vị trí Fresher'
    ]
  },
  {
    level: 'Fresher',
    companyType: 'Outsourcing',
    companyTypeLabel: 'Công ty Outsourcing / Global SI',
    salaryRangeVnd: '8.000.000 – 13.000.000 VNĐ / tháng',
    interviewRounds: '1 vòng Test Coding/SQL + 1 vòng Phỏng vấn Kỹ thuật với Tech Lead',
    mustHaveSkills: [
      'Thành thạo xây dựng RESTful API với Spring Boot, Spring Data JPA và xử lý Exception tập trung (@RestControllerAdvice)',
      'Hiểu rõ @Transactional, Bean Scopes, Constructor Injection và cách ánh xạ Entity – DTO',
      'Viết câu lệnh SQL tối ưu, biết dùng Index cơ bản và tuân thủ nghiêm ngặt quy tắc Git Flow của dự án'
    ],
    bonusDifferentiators: [
      'Giao tiếp tiếng Anh hoặc tiếng Nhật tốt để làm việc trực tiếp với khách hàng quốc tế',
      'Biết viết Unit Test với JUnit 5 + Mockito đạt độ phủ >80% theo yêu cầu SonarQube'
    ],
    nextLevelRoadmap: [
      'Rèn kỹ năng đọc hiểu tài liệu đặc tả (SRS/Basic Design) và ước lượng thời gian (Estimation) chính xác',
      'Đào sâu hiệu năng Database (N+1 Query, EXPLAIN) và Concurrency để thăng tiến lên Junior'
    ]
  },
  {
    level: 'Fresher',
    companyType: 'Product',
    companyTypeLabel: 'Công ty Product / Tech Startup',
    salaryRangeVnd: '10.000.000 – 16.000.000 VNĐ / tháng',
    interviewRounds: '1 vòng Live Coding/SQL + 1 vòng Deep-Dive Java/Spring + 1 vòng Culture Fit (STAR)',
    mustHaveSkills: [
      'Hiểu sâu Spring Boot: Vòng đời Bean, Constructor Injection, Spring AOP Proxy và bẫy @Transactional Self-Invocation',
      'Làm chủ JPA/Hibernate: Phân biệt LAZY vs EAGER, phát hiện và xử lý lỗi N+1 Query, phân biệt DTO vs Entity',
      'Hiểu cấu trúc B-Tree Index, đọc được bảng EXPLAIN cơ bản và nắm vững 4 tính chất ACID của Transaction'
    ],
    bonusDifferentiators: [
      'Biết sử dụng Redis làm Cache-Aside và xử lý bài toán thu hồi JWT (Blacklist/Refresh Token)',
      'Viết được Unit Test có dùng Mockito (@Mock, @InjectMocks) cho các luồng nghiệp vụ chính'
    ],
    nextLevelRoadmap: [
      'Thực hành xử lý bài toán Race Condition (Optimistic vs Pessimistic Lock)',
      'Tìm hiểu về HikariCP Connection Pool, ThreadPoolExecutor và Message Queue (Kafka/RabbitMQ)',
      'Rèn luyện tác phong Code Review, viết tài liệu OpenAPI/Swagger để tiến lên Junior'
    ]
  },
  {
    level: 'Fresher',
    companyType: 'Fintech',
    companyTypeLabel: 'Ngân Hàng Số / Fintech',
    salaryRangeVnd: '12.000.000 – 18.000.000 VNĐ / tháng + Thưởng định kỳ',
    interviewRounds: '1 vòng Test Thuật toán & SQL + 1 vòng Phỏng vấn Core Java/DB Transaction + 1 vòng HR',
    mustHaveSkills: [
      'Nắm cực chắc ACID, Transaction Isolation Levels (Read Committed, Repeatable Read) và cách dùng kiểu BigDecimal cho tiền tệ',
      'Hiểu cơ chế khóa trong Database (Optimistic Lock @Version vs Pessimistic Lock SELECT ... FOR UPDATE)',
      'Nắm vững bảo mật API: OAuth2/JWT, mã hóa dữ liệu nhạy cảm, chống SQL Injection và ghi Audit Log đầy đủ'
    ],
    bonusDifferentiators: [
      'Hiểu khái niệm Idempotency-Key chống trừ tiền 2 lần khi mạng chập chờn hoặc người dùng bấm đúp',
      'Biết cơ bản về bất đồng bộ với Kafka/RabbitMQ và cơ chế Retry / Dead Letter Queue (DLQ)'
    ],
    nextLevelRoadmap: [
      'Làm chủ kiến trúc đối soát giao dịch (Reconciliation), Transactional Outbox và xử lý tải cao',
      'Nâng cao kỹ năng đọc hiểu Thread Dump và tối ưu HikariCP để lên Junior Fintech'
    ]
  },
  {
    level: 'Junior',
    companyType: 'Product',
    companyTypeLabel: 'Công ty Product / Quy mô lớn',
    salaryRangeVnd: '16.000.000 – 26.000.000 VNĐ / tháng',
    interviewRounds: '1 vòng DSA/SQL + 1 vòng System Design & Troubleshooting + 1 vòng Bar Raiser/Manager',
    mustHaveSkills: [
      'Java Concurrency & JVM: Hiểu ConcurrentHashMap, ThreadPoolExecutor internals, ThreadLocal leak và Garbage Collection',
      'Database Tuning: Quy tắc Leftmost Prefix của Composite Index, Isolation Levels, MVCC và xử lý Deadlock',
      'Thiết kế API chịu lỗi: Idempotency-Key chống trừ tiền 2 lần, Rate Limiting, Circuit Breaker và Caching (Stampede/Penetration)'
    ],
    bonusDifferentiators: [
      'Có kinh nghiệm thực tế xử lý sự cố Production (đọc Grafana/Prometheus metrics, phân tích slow query log)',
      'Hiểu rõ giao thức mạng: TCP 3-way handshake, TLS 1.3, HTTP/2 multiplexing và cơ chế Transactional Outbox'
    ],
    nextLevelRoadmap: [
      'Làm chủ kiến trúc phân tán: Saga Pattern, Event-Driven với Kafka (Consumer Group, Rebalance, DLQ)',
      'Đủ khả năng độc lập thiết kế một module từ đầu tới cuối (System Design LLD/HLD) để lên Middle'
    ]
  },
  {
    level: 'Junior',
    companyType: 'Fintech',
    companyTypeLabel: 'Ngân Hàng / Fintech Quy Mô Lớn',
    salaryRangeVnd: '18.000.000 – 28.000.000 VNĐ / tháng',
    interviewRounds: '1 vòng Live Coding + 1 vòng Deep-Dive Concurrency & Database Locking + 1 vòng Engineering Manager',
    mustHaveSkills: [
      'Làm chủ bài toán giao dịch đồng thời cao: Chống Lost Update, Double-Spending bằng Pessimistic/Optimistic Lock & Redis Lua Script',
      'Hiểu sâu Kafka internals: Ack=all, min.insync.replicas, Idempotent Producer và chống xử lý trùng message ở Consumer',
      'Thiết kế bảng dữ liệu lớn (Partitioning, Indexing), phân tích Execution Plan và tối ưu HikariCP Connection Pool'
    ],
    bonusDifferentiators: [
      'Hiểu rõ mô hình Saga (Orchestration vs Choreography) và патtern Transactional Outbox đảm bảo nhất quán dữ liệu',
      'Có kinh nghiệm viết Integration Test với Testcontainers và thiết lập cảnh báo Metric/Tracing (Micrometer/OpenTelemetry)'
    ],
    nextLevelRoadmap: [
      'Chủ trì thiết kế các dịch vụ lõi (Core Banking/Payment Gateway) chịu tải hàng nghìn TPS để lên Middle'
    ]
  },
  {
    level: 'Middle',
    companyType: 'BigTech',
    companyTypeLabel: 'Big Tech / Kỳ Lân / Global',
    salaryRangeVnd: '28.000.000 – 48.000.000+ VNĐ / tháng',
    interviewRounds: '4 vòng: Coding + Deep Technical + System Design (High Scale) + Behavioral Bar Raiser',
    mustHaveSkills: [
      'Tối ưu hiệu năng tầng sâu: Phân tích Heap Dump/Thread Dump, tinh chỉnh GC (G1GC/ZGC), tối ưu HikariCP & I/O',
      'Thiết kế hệ thống phân tán (System Design): Sharding vs Partitioning, Replication lag, Distributed Lock, Outbox Pattern',
      'Chủ động dẫn dắt kỹ thuật: Thiết lập tiêu chuẩn code, review PR cho Fresher/Junior và trực xử lý sự cố (On-call)'
    ],
    bonusDifferentiators: [
      'Đóng góp vào quyết định kiến trúc (ADR - Architecture Decision Records) với phân tích đánh đổi (Trade-offs) rõ ràng',
      'Tư duy sản phẩm mạnh mẽ: Biết cân bằng giữa tốc độ ra mắt tính năng (Time-to-market) và độ ổn định kỹ thuật'
    ],
    nextLevelRoadmap: [
      'Mở rộng tầm ảnh hưởng liên đội nhóm (Cross-team architecture) và huấn luyện đội ngũ để tiến lên Senior'
    ]
  }
];

// ============================================================================
// 4. NHÓM 3A: GIẢ LẬP CA TRỰC SỰ CỐ 2H SÁNG (INCIDENT WAR-ROOM SIMULATOR)
// ============================================================================
export const INCIDENT_WAR_ROOM_SCENARIOS: IncidentScenario[] = [
  {
    id: 'inc-hikaricp-starvation',
    title: 'Sự Cố #1: 02:00 Sáng Ngày Flash Sale — Cạn Kiệt HikariCP Connection Pool!',
    timeTag: '02:00 AM • Flash Sale 10/10',
    severity: 'SEV-1 (Nghiêm trọng)',
    alertBanner: '🚨 PagerDuty Alert: 92% request tới API Đặt Hàng đang thất bại với lỗi "HikariPool-1 - Connection is not available, request timed out after 30000ms"!',
    stages: [
      {
        stageNumber: 1,
        stageTitle: 'Bước 1/3: Khoanh vùng nguyên nhân trong 2 phút đầu',
        situationText: 'Biểu đồ Grafana cho thấy toàn bộ 20/20 kết nối trong HikariCP đang ở trạng thái Active nhưng CPU của Database chỉ ở mức 15% (rất thấp!). Bạn kiểm tra gì đầu tiên?',
        choices: [
          {
            id: 'c1',
            actionText: 'Kiểm tra Thread Dump / Code của hàm @Transactional đặt hàng xem có lệnh gọi HTTP API bên thứ 3 (Cổng thanh toán / Gửi Email) nằm BÊN TRONG khối @Transactional hay không.',
            isOptimal: true,
            hpDelta: 0,
            outcomeFeedback: 'Chính xác tuyệt đối! Vì CPU của DB chỉ 15% nên DB không hề bị quá tải câu lệnh SQL. Thủ phạm là hàm đặt hàng đang mở @Transactional (giữ chặt DB Connection) rồi lại đứng chờ gọi API cổng thanh toán bên ngoài mất 5 giây!'
          },
          {
            id: 'c2',
            actionText: 'Khởi động lại (Restart) ngay lập tức máy chủ Database PostgreSQL.',
            isOptimal: false,
            hpDelta: -35,
            outcomeFeedback: 'Sai lầm nguy hiểm! Database đang khỏe mạnh (CPU 15%). Restart DB lúc Flash Sale sẽ làm mất toàn bộ Buffer Pool cache và đánh sập toàn bộ các dịch vụ khác!'
          },
          {
            id: 'c3',
            actionText: 'Tăng kích thước HikariCP maximum-pool-size từ 20 lên 2000 kết nối ngay lập tức.',
            isOptimal: false,
            hpDelta: -25,
            outcomeFeedback: 'Chưa chuẩn! Đẩy 2000 kết nối xuống DB sẽ gây bão Context Switching làm sập luôn máy chủ Database.'
          }
        ]
      },
      {
        stageNumber: 2,
        stageTitle: 'Bước 2/3: Cầm máu hệ thống ngay lập tức (Mitigation)',
        situationText: 'Bạn phát hiện đúng là cổng gửi SMS/Email đang bị treo 10 giây bên trong hàm @Transactional! Bạn cần làm gì để cứu hệ thống trong 5 phút tới?',
        choices: [
          {
            id: 'c1',
            actionText: 'Tắt tạm thời cờ (Feature Flag) gọi đồng bộ sang dịch vụ SMS/Email hoặc đặt Timeout ngắn (1.5s) kèm Circuit Breaker để giải phóng ngay các kết nối DB đang bị ngâm.',
            isOptimal: true,
            hpDelta: 0,
            outcomeFeedback: 'Quyết định chuẩn Senior! Ngay khi ngắt cuộc gọi I/O bị treo, thời gian giữ DB Connection giảm từ 10 giây xuống 15ms, HikariCP Pool lập tức thông thoáng trở lại!'
          },
          {
            id: 'c2',
            actionText: 'Xóa bảng orders đi tạo lại cho nhẹ.',
            isOptimal: false,
            hpDelta: -50,
            outcomeFeedback: 'Thảm họa! Không bao giờ được đụng tới dữ liệu Production khi chưa hiểu nguyên nhân.'
          }
        ]
      },
      {
        stageNumber: 3,
        stageTitle: 'Bước 3/3: Giải pháp kiến trúc triệt để (Root Cause Fix)',
        situationText: 'Sau khi hệ thống đã ổn định, sáng hôm sau bạn sửa lại code như thế nào để sự cố này không bao giờ tái diễn?',
        choices: [
          {
            id: 'c1',
            actionText: 'Tách toàn bộ các cuộc gọi HTTP / gửi Email ra NGOÀI phạm vi @Transactional (hoặc đẩy qua Message Queue / @TransactionalEventListener(phase = AFTER_COMMIT)).',
            isOptimal: true,
            hpDelta: 0,
            outcomeFeedback: 'Hoàn hảo 10/10! DB Transaction chỉ được chứa các thao tác DB thuần túy trong vài mili-giây. Mọi tác vụ mạng/gửi thông báo phải thực hiện sau khi Transaction đã COMMIT.'
          },
          {
            id: 'c2',
            actionText: 'Bỏ hẳn @Transactional trên toàn bộ dự án để không bao giờ giữ kết nối nữa.',
            isOptimal: false,
            hpDelta: -30,
            outcomeFeedback: 'Sai! Bỏ @Transactional sẽ làm mất tính toàn vẹn dữ liệu (ACID) khi đơn hàng bị lỗi giữa chừng.'
          }
        ]
      }
    ],
    postMortemLesson: 'Bài học xương máu: Tuyệt đối KHÔNG BAO GIỜ gọi HTTP API bên ngoài, gửi Email hay xử lý file nặng bên trong khối @Transactional! Hãy dùng @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT).'
  },
  {
    id: 'inc-cache-stampede',
    title: 'Sự Cố #2: 12:00 Trưa — Sập Database Vì Bão Cache Stampede!',
    timeTag: '12:00 PM • Giờ Cao Điểm',
    severity: 'SEV-1 (Nghiêm trọng)',
    alertBanner: '🚨 Cảnh báo: Key Redis chứa "Danh sách Banner Trang Chủ" vừa hết hạn TTL đúng 12:00:00. Lập tức 5.000 request/giây cùng bị Cache Miss và bổ nhào xuống Database làm CPU DB vọt lên 100%!',
    stages: [
      {
        stageNumber: 1,
        stageTitle: 'Bước 1/3: Nhận diện bản chất sự cố',
        situationText: 'Hiện tượng 1 key cực nóng (Hot Key) hết hạn TTL khiến hàng ngàn luồng cùng lúc chọc thẳng xuống Database để tính toán lại cùng một dữ liệu gọi là gì?',
        choices: [
          {
            id: 'c1',
            actionText: 'Cache Breakdown / Cache Stampede (Hiệu ứng đàn bò giẫm đạp lên 1 Hot Key).',
            isOptimal: true,
            hpDelta: 0,
            outcomeFeedback: 'Chính xác! Khi 5.000 luồng cùng thấy cache trống, cả 5.000 luồng đều chạy câu query nặng dưới DB cùng lúc.'
          },
          {
            id: 'c2',
            actionText: 'SQL Injection.',
            isOptimal: false,
            hpDelta: -25,
            outcomeFeedback: 'Chưa đúng, đây là lưu lượng hợp lệ từ trang chủ bị lọt qua tầng Cache khi TTL hết hạn.'
          }
        ]
      },
      {
        stageNumber: 2,
        stageTitle: 'Bước 2/3: Ngăn chặn 5.000 luồng cùng truy vấn DB',
        situationText: 'Làm sao để khi Cache Miss xảy ra trên Hot Key, chỉ có ĐÚNG 1 luồng duy nhất được phép xuống Database lấy dữ liệu và nạp lại vào Redis?',
        choices: [
          {
            id: 'c1',
            actionText: 'Áp dụng Distributed Mutex Lock (SETNX) khi rebuild cache hoặc dùng Logical Expiration (lưu hạn sử dụng logic bên trong payload và làm mới ngầm bất đồng bộ).',
            isOptimal: true,
            hpDelta: 0,
            outcomeFeedback: 'Tuyệt vời! Với Mutex Lock hoặc Logical Expiration, 4.999 luồng còn lại sẽ nhận dữ liệu vừa được nạp (hoặc bản dữ liệu cũ hợp lệ) mà không đụng tới Database.'
          },
          {
            id: 'c2',
            actionText: 'Đặt TTL = 1 giây để cache làm mới liên tục.',
            isOptimal: false,
            hpDelta: -30,
            outcomeFeedback: 'Nguy hiểm! TTL 1 giây nghĩa là cứ mỗi giây Database lại bị giẫm đạp một lần!'
          }
        ]
      },
      {
        stageNumber: 3,
        stageTitle: 'Bước 3/3: Phòng chống thêm hiệu ứng Tuyết Lở (Cache Avalanche)',
        situationText: 'Ngoài Hot Key trên, bạn phát hiện 10.000 key sản phẩm khác đều được nạp lúc 00:00 đêm với cùng TTL = 24 giờ. Làm sao để chúng không hết hạn đồng loạt vào nửa đêm nay?',
        choices: [
          {
            id: 'c1',
            actionText: 'Cộng thêm một khoảng thời gian ngẫu nhiên (Random Jitter, ví dụ: TTL = 24 giờ + random(0..30 phút)) khi lưu từng key vào Redis.',
            isOptimal: true,
            hpDelta: 0,
            outcomeFeedback: 'Chuẩn kiến trúc sư! Thêm Random Jitter vào TTL giúp rải đều thời điểm hết hạn của các key, xóa sổ hoàn toàn nguy cơ Cache Avalanche.'
          },
          {
            id: 'c2',
            actionText: 'Tắt hoàn toàn Redis vào ban đêm.',
            isOptimal: false,
            hpDelta: -40,
            outcomeFeedback: 'Sai! Tắt Redis sẽ đẩy toàn bộ tải đọc xuống Database.'
          }
        ]
      }
    ],
    postMortemLesson: 'Bài học xương máu: Với Hot Key ➔ Dùng Mutex Lock / Logical Expiration chống Cache Stampede. Với danh sách Key hàng loạt ➔ Luôn cộng thêm Random Jitter vào TTL chống Cache Avalanche!'
  }
];

// ============================================================================
// 5. NHÓM 3B: BỘ FLASHCARD LẬT NHANH 15 PHÚT TRƯỚC GIỜ PHỎNG VẤN
// ============================================================================
export const QUICK_CRAM_FLASHCARDS: CramFlashcard[] = [
  {
    id: 'fc-1',
    category: 'Java Core',
    question: 'Cơ chế bên dưới của HashMap trong Java 8+ hoạt động như thế nào?',
    threeGoldenKeywords: ['Mảng Node[] + LinkedList', 'Ngưỡng Treeify = 8 & Capacity >= 64', 'Load Factor 0.75 (Resize x2)'],
    oneLinerPunchline: 'Băm key bằng hashCode() ^ (h >>> 16), tìm vị trí bằng (n - 1) & hash; nếu đụng độ dùng LinkedList, vượt 8 phần tử (và mảng >= 64) thì chuyển sang Red-Black Tree O(log n).'
  },
  {
    id: 'fc-2',
    category: 'Java Core',
    question: 'Tại sao khi override equals() bắt buộc phải override luôn hashCode()?',
    threeGoldenKeywords: ['Hợp đồng equals-hashCode', 'Xác định đúng Bucket trong HashMap/HashSet', 'Tránh mất dữ liệu khi tra cứu'],
    oneLinerPunchline: 'Hai object bằng nhau theo equals() BẮT BUỘC phải có cùng hashCode(); nếu không, HashMap sẽ tìm sai bucket và trả về null dù object đã được đưa vào Map.'
  },
  {
    id: 'fc-3',
    category: 'Java Core',
    question: 'Khi nào ThreadPoolExecutor tạo thêm luồng mới (maxPoolSize) thay vì đẩy vào Queue?',
    threeGoldenKeywords: ['corePoolSize đầy trước', 'workQueue phải đầy tiếp theo', 'Mới mở thêm tới maxPoolSize'],
    oneLinerPunchline: 'Luồng mới vượt quá corePoolSize CHỈ được tạo khi hàng đợi (workQueue) đã đầy! Nếu dùng LinkedBlockingQueue không giới hạn thì maxPoolSize hoàn toàn vô tác dụng.'
  },
  {
    id: 'fc-4',
    category: 'Spring Boot',
    question: 'Tại sao gọi hàm @Transactional trong cùng một class (this.methodB()) lại không chạy Transaction?',
    threeGoldenKeywords: ['Spring AOP Proxy', 'Lỗi Self-Invocation qua this', 'Không đi qua TransactionInterceptor'],
    oneLinerPunchline: 'Spring bọc Bean bằng lớp vỏ AOP Proxy ở ngoài; gọi nội bộ qua this đi thẳng vào object gốc nên bỏ qua Proxy và không mở Transaction.'
  },
  {
    id: 'fc-5',
    category: 'Spring Boot',
    question: 'Tại sao Spring khuyên dùng Constructor Injection thay vì @Autowired trên Field?',
    threeGoldenKeywords: ['Khai báo được biến final (Immutable)', 'Dễ viết Unit Test không cần Spring Context', 'Phát hiện sớm lỗi Circular Dependency lúc khởi động'],
    oneLinerPunchline: 'Constructor Injection giúp dependency bất biến (final), tránh NullPointerException và dễ dàng truyền Mock object khi chạy Unit Test.'
  },
  {
    id: 'fc-6',
    category: 'SQL & DB',
    question: 'Làm sao xử lý triệt để lỗi N+1 Query trong Hibernate / Spring Data JPA?',
    threeGoldenKeywords: ['Giữ mặc định FetchType.LAZY', 'Dùng LEFT JOIN FETCH hoặc @EntityGraph', 'Hoặc dùng @BatchSize / DTO Projection'],
    oneLinerPunchline: 'Tuyệt đối không đổi sang EAGER một cách mù quáng; hãy giữ LAZY và chủ động viết JPQL JOIN FETCH hoặc @EntityGraph cho đúng API cần lấy bảng con.'
  },
  {
    id: 'fc-7',
    category: 'SQL & DB',
    question: 'Khi nào dùng Optimistic Lock (@Version), khi nào dùng Pessimistic Lock (FOR UPDATE)?',
    threeGoldenKeywords: ['Optimistic: Đọc nhiều, ít đụng độ (dùng cột @Version)', 'Pessimistic: Ghi nhiều, tranh chấp cao (khóa dòng DB)', 'Chống Lost Update / Overselling'],
    oneLinerPunchline: 'Ít xung đột thì dùng Optimistic Lock (@Version) để đạt thông lượng cao; tranh chấp gay gắt hoặc trừ tiền ví thì dùng Pessimistic Lock (SELECT ... FOR UPDATE).'
  },
  {
    id: 'fc-8',
    category: 'Network',
    question: 'Làm thế nào để thu hồi (Revoke) một JWT trước khi nó hết hạn?',
    threeGoldenKeywords: ['Access Token ngắn hạn (5-15 phút)', 'Refresh Token Rotation lưu DB/Redis', 'Redis Blacklist lưu jti với TTL phần thời gian còn lại'],
    oneLinerPunchline: 'Kết hợp Access Token ngắn hạn với Redis Blacklist (chứa mã jti của token bị thu hồi có TTL bằng thời gian sống còn lại của token đó).'
  }
];

export interface CareerReadinessSummary {
  readinessScore: number;
  rankTitle: string;
  rankColor: string;
  nextMilestoneHint: string;
}

/**
 * Computes an overall Career Readiness score (0-100) and Rank Badge from user's interactive progress.
 */
export function computeCareerReadiness(params: {
  probationPercent: number;
  mockBestScore: number;
  solvedDailyCount: number;
  masteredFlashcardsCount: number;
}): CareerReadinessSummary {
  const pScore = Math.min(100, Math.max(0, params.probationPercent || 0)) * 0.25;
  const mScore = Math.min(100, Math.max(0, params.mockBestScore || 0)) * 0.35;
  const dScore = Math.min(100, ((params.solvedDailyCount || 0) / DAILY_MICRO_CHALLENGES.length) * 100) * 0.2;
  const fScore = Math.min(100, ((params.masteredFlashcardsCount || 0) / QUICK_CRAM_FLASHCARDS.length) * 100) * 0.2;

  const readinessScore = Math.min(100, Math.round(pScore + mScore + dScore + fScore));

  if (readinessScore >= 80) {
    return {
      readinessScore,
      rankTitle: '🏆 Bar Raiser • Sẵn Sàng Săn Offer Lớn',
      rankColor: '#10b981',
      nextMilestoneHint: 'Phong độ xuất sắc! Hãy tự tin nộp CV và bước vào các vòng phỏng vấn thực tế.'
    };
  }
  if (readinessScore >= 55) {
    return {
      readinessScore,
      rankTitle: '⚡ Junior Contender • Nền Tảng Vững Vàng',
      rankColor: '#0ea5e9',
      nextMilestoneHint: 'Thử sức thêm với Ca Trực Sự Cố 2h Sáng và hoàn thành bộ Flashcard để đạt cấp Bar Raiser!'
    };
  }
  if (readinessScore >= 25) {
    return {
      readinessScore,
      rankTitle: '🚀 Fresher Ready • Đang Tăng Tốc',
      rankColor: '#8b5cf6',
      nextMilestoneHint: 'Hãy giải thêm Thử thách 60s mỗi ngày và luyện 1 buổi Phỏng vấn thử AI để bứt phá!'
    };
  }
  return {
    readinessScore,
    rankTitle: '🌱 Intern Explorer • Khởi Đầu Hành Trình',
    rankColor: '#f59e0b',
    nextMilestoneHint: 'Bắt đầu ngay với Thử thách 60s hôm nay hoặc mở công cụ Bác Sĩ Sửa CV bên dưới nhé!'
  };
}
