export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  avatarIcon: string;
  companyId: string;
  bio: string;
  welcomeGreeting: string;
  positiveReaction: string;
  neutralReaction: string;
  constructiveReaction: string;
  hintPrefix: string;
  gender: 'male' | 'female';
}

export interface CandidateQAOption {
  id: string;
  question: string;
  interviewerAnswer: string;
}

export interface MaskedCompany {
  id: string;
  maskedName: string; // e.g. "G***", "A***", "N***", "M***", "S***", "T***", "V***", "F***"
  realWorldHint: string; // e.g. "Big Tech Search & Cloud Leader"
  badgeColor: string;
  badgeBgDark: string;
  badgeBgLight: string;
  badgeBorder: string;
  tagline: string;
  description: string;
  preferredTopics: Array<'Java Backend' | 'Spring Boot' | 'Database' | 'Network'>;
  cultureAndBarRaiserTip: string;
  interviewers: InterviewerPersona[];
  candidateQA: CandidateQAOption[];
}

export interface LevelProfile {
  level: 'Intern' | 'Fresher' | 'Junior';
  title: string;
  targetAudience: string;
  defaultQuestionCount: number;
  expectedDurationMinutes: number;
  coreExpectations: string[];
  passThresholdScore: number;
  strongHireThresholdScore: number;
}

export const ENTRY_LEVEL_PROFILES: Record<'Intern' | 'Fresher' | 'Junior', LevelProfile> = {
  Intern: {
    level: 'Intern',
    title: '🌱 Thực Tập Sinh (Intern)',
    targetAudience: 'Sinh viên năm 3, năm 4 hoặc người chuyển ngành tìm kiếm cơ hội thực tập kỹ thuật.',
    defaultQuestionCount: 4,
    expectedDurationMinutes: 20,
    coreExpectations: [
      'Nắm chắc 4 tính chất OOP (Kế thừa, Đa hình, Đóng gói, Trừu tượng).',
      'Phân biệt mô hình bộ nhớ cơ bản: Stack vs Heap, kiểu nguyên thủy vs Object reference.',
      'Hiểu rõ các Collection hay dùng: ArrayList, LinkedList, HashMap cơ bản.',
      'Kiến thức SQL CRUD, JOIN cơ bản và giao thức HTTP cơ bản.',
      'Thái độ trung thực, ham học hỏi và tư duy phản biện trong sáng.'
    ],
    passThresholdScore: 60,
    strongHireThresholdScore: 80
  },
  Fresher: {
    level: 'Fresher',
    title: '🚀 Kỹ Sư Mới Tốt Nghiệp (Fresher)',
    targetAudience: 'Sinh viên mới tốt nghiệp hoặc lập trình viên dưới 1 năm kinh nghiệm.',
    defaultQuestionCount: 5,
    expectedDurationMinutes: 30,
    coreExpectations: [
      'Hiểu sâu cơ chế hoạt động của HashMap (Bucket, Chaining, Treeify từ Java 8).',
      'Hiểu rõ nguyên lý Spring Framework: IoC Container, Dependency Injection, Bean Lifecycle.',
      'Biết cách quản trị Database Transaction, Index B-Tree, tránh Full Table Scan.',
      'Viết mã sạch (Clean Code), xử lý ngoại lệ bài bản với Custom Exception & ControllerAdvice.',
      'Tự tin giải thích luồng xử lý từ Client -> API Gateway -> Controller -> Service -> DB.'
    ],
    passThresholdScore: 70,
    strongHireThresholdScore: 85
  },
  Junior: {
    level: 'Junior',
    title: '⚡ Kỹ Sư Junior (1 - 2 Năm Kinh Nghiệm)',
    targetAudience: 'Kỹ sư backend đã có kinh nghiệm thực chiến production 1 - 2 năm.',
    defaultQuestionCount: 5,
    expectedDurationMinutes: 35,
    coreExpectations: [
      'Xử lý tranh chấp Concurrency: Thread safety, Race Condition, Optimistic vs Pessimistic Lock.',
      'Tối ưu hiệu năng JPA / Hibernate: Khắc phục triệt để vấn đề N+1 query, First-level / Second-level cache.',
      'Sử dụng an toàn cơ chế Spring Transactional, hiểu rõ proxy self-invocation trap.',
      'Tư duy thiết kế RESTful API chuẩn, xử lý lỗi phân tầng và bảo vệ hệ thống trước sự cố.',
      'Kinh nghiệm thực tế khi điều tra và debug sự cố OutOfMemoryError, High CPU, DB Connection Leak.'
    ],
    passThresholdScore: 75,
    strongHireThresholdScore: 88
  }
};

export const MASKED_COMPANIES: MaskedCompany[] = [
  {
    id: 'company-g',
    maskedName: 'G***',
    realWorldHint: 'Tập đoàn Công nghệ Tìm kiếm, Điện toán Đám mây & AI Toàn cầu',
    badgeColor: '#0ea5e9',
    badgeBgDark: 'rgba(14, 165, 233, 0.15)',
    badgeBgLight: '#e0f2fe',
    badgeBorder: '#38bdf8',
    tagline: 'Googleiness & Tư duy Nền tảng Khoa học Máy tính Cốt lõi',
    description: 'Vòng phỏng vấn tại G*** nổi tiếng với việc đánh giá bản chất sâu sắc của hệ thống: cấu trúc dữ liệu, mô hình bộ nhớ máy tính, phân tích độ phức tạp thời gian và không gian.',
    preferredTopics: ['Java Backend', 'Network'],
    cultureAndBarRaiserTip: 'Ở G***, bạn không cần phải học vẹt các cú pháp framework mà cần giải thích được "Tại sao?". Hãy luôn phân tích trade-off (sự đánh đổi) về bộ nhớ và CPU khi chọn giải pháp.',
    interviewers: [
      {
        id: 'interviewer-g-alex',
        name: 'Alex T.',
        role: 'Senior Staff Engineer & Bar Raiser @ G***',
        avatarIcon: '👨‍💻',
        companyId: 'company-g',
        bio: '8+ năm phát triển hạ tầng backend phân tán, từng tham gia phỏng vấn hơn 200 ứng viên từ Intern đến Staff.',
        welcomeGreeting: 'Chào bạn! Chào mừng bạn đến với vòng phỏng vấn kỹ thuật tại G***. Hôm nay chúng ta sẽ cùng trao đổi về tư duy giải quyết vấn đề và nền tảng máy tính. Hãy xem đây là một buổi trao đổi kỹ thuật cởi mở nhé!',
        positiveReaction: 'Rất ấn tượng! Bạn đã chỉ ra chính xác bản chất cơ chế bộ nhớ và độ phức tạp tính toán. Đây chính là tiêu chuẩn mà G*** kỳ vọng.',
        neutralReaction: 'Ý tưởng cơ bản của bạn đã đúng hướng. Tuy nhiên, nếu bạn phân tích sâu hơn về mặt tài nguyên hệ thống và cạm bẫy tiềm ẩn thì câu trả lời sẽ thuyết phục hơn rất nhiều.',
        constructiveReaction: 'Cảm ơn chia sẻ của bạn. Câu hỏi này có một cạm bẫy ngầm mà nhiều ứng viên hay bỏ sót. Để mình cùng bạn phân tích lại góc nhìn cốt lõi nhé.',
        hintPrefix: 'Gợi ý từ Alex: Hãy thử nghĩ về cách JVM quản lý vùng nhớ và điều gì xảy ra ở mức byte code hoặc CPU cache nhé.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'g-qa-1',
        question: 'Tại G***, một ngày làm việc điển hình của một kỹ sư entry-level (Intern/Fresher) sẽ như thế nào?',
        interviewerAnswer: 'Tại G***, mỗi bạn Intern hay Fresher đều được phân công một Mentor (Host) 1:1 tận tâm. Buổi sáng bạn sẽ tham gia standup, làm việc trên dự án thật có impact người dùng, và dành ít nhất 20% thời gian để đọc design doc và học hỏi các best practices kỹ thuật.'
      },
      {
        id: 'g-qa-2',
        question: 'Quy trình Code Review và bảo đảm chất lượng phần mềm tại G*** diễn ra khắt khe ra sao?',
        interviewerAnswer: 'Mọi thay đổi code đều cần vượt qua hệ thống CI tự động với hàng nghìn unit/integration test và cần ít nhất một kỹ sư có thẩm quyền Readability phê duyệt. Điều này rèn luyện cho bạn thói quen viết code cực kỳ sạch và có trách nhiệm.'
      }
    ]
  },
  {
    id: 'company-a',
    maskedName: 'A***',
    realWorldHint: 'Tập đoàn Thương mại Điện tử & Hạ tầng Đám mây AWS Hàng đầu',
    badgeColor: '#f59e0b',
    badgeBgDark: 'rgba(245, 158, 11, 0.15)',
    badgeBgLight: '#fef3c7',
    badgeBorder: '#fcd34d',
    tagline: 'Customer Obsession & Tiêu chuẩn Bar Raiser Khắt khe',
    description: 'Quy trình tuyển dụng tại A*** sử dụng tiêu chuẩn "Bar Raiser" để đảm bảo mỗi ứng viên mới đều giỏi hơn ít nhất 50% số nhân sự hiện tại cùng cấp bậc.',
    preferredTopics: ['Spring Boot', 'Database'],
    cultureAndBarRaiserTip: 'A*** đặc biệt coi trọng khả năng xử lý bài toán thực tế, tư duy sở hữu (Ownership) và thấu hiểu nguyên lý kiến trúc hướng dịch vụ (Service-Oriented Architecture).',
    interviewers: [
      {
        id: 'interviewer-a-sarah',
        name: 'Sarah N.',
        role: 'Bar Raiser & Senior Platform Lead @ A***',
        avatarIcon: '👩‍💻',
        companyId: 'company-a',
        bio: '7 năm xây dựng dịch vụ high-throughput tại AWS. Đóng vai trò Bar Raiser độc lập cho các hội đồng tuyển dụng.',
        welcomeGreeting: 'Chào bạn! Mình là Sarah, Bar Raiser tại A*** hôm nay. Nhiệm vụ của mình là đồng hành để giúp bạn thể hiện được năng lực kỹ thuật tốt nhất. Chúng ta bắt đầu nhé!',
        positiveReaction: 'Câu trả lời rất xuất sắc! Bạn thể hiện rõ tính Ownership và tư duy kiến trúc bền vững, rất phù hợp với tiêu chuẩn kỹ sư tại A***.',
        neutralReaction: 'Bạn đã nêu được giải pháp chính. Nhưng trong môi trường production chịu tải cao, bạn sẽ cần cân nhắc thêm về tính sẵn sàng và khả năng chịu lỗi (fault tolerance).',
        constructiveReaction: 'Giải pháp này có thể hoạt động trong môi trường lab nhỏ, nhưng sẽ gặp rủi ro nghẽn cổ chai khi tải tăng đột biến. Cùng xem xét thêm nhé!',
        hintPrefix: 'Gợi ý từ Sarah: Hãy suy nghĩ theo nguyên lý Deep Dive — cơ chế bên dưới framework thực hiện điều này thông qua proxy hay reflection?',
        gender: 'female'
      }
    ],
    candidateQA: [
      {
        id: 'a-qa-1',
        question: 'A*** hỗ trợ các bạn trẻ mới vào nghề phát triển kỹ năng nhanh chóng như thế nào?',
        interviewerAnswer: 'Chúng mình áp dụng văn hóa "Ownership" từ ngày đầu tiên. Bạn sẽ được trực tiếp sở hữu một microservice hoặc feature, tự tay viết thiết kế kỹ thuật (Design Doc), test, deploy và monitor trên production dưới sự bảo trợ của Senior.'
      },
      {
        id: 'a-qa-2',
        question: 'Tiêu chuẩn đánh giá "Bar Raiser" tìm kiếm điều gì nhất ở một ứng viên Junior?',
        interviewerAnswer: 'Bar Raiser không chỉ tìm người biết code, mà tìm người có "Customer Obsession" — luôn tự hỏi giải pháp kỹ thuật này giúp gì cho độ trễ người dùng, có dễ bảo trì cho đồng nghiệp sau này hay không.'
      }
    ]
  },
  {
    id: 'company-n',
    maskedName: 'N***',
    realWorldHint: 'Nền tảng Streaming Toàn cầu & Tiên phong Kiến trúc Microservices',
    badgeColor: '#ef4444',
    badgeBgDark: 'rgba(239, 68, 68, 0.15)',
    badgeBgLight: '#fee2e2',
    badgeBorder: '#fca5a5',
    tagline: 'Freedom & Responsibility • Kiến trúc High-Resilience Khủng',
    description: 'Nơi khai sinh ra các công cụ microservices kinh điển (Eureka, Hystrix, Zuul). Phỏng vấn tại N*** chú trọng tính phản xạ, xử lý bất đồng bộ và khả năng tự phục hồi.',
    preferredTopics: ['Network', 'Spring Boot'],
    cultureAndBarRaiserTip: 'Ở N***, văn hóa cốt lõi là Tự do và Trách nhiệm (Freedom and Responsibility). Bạn cần thể hiện sự chủ động cao và hiểu biết về tính ổn định hệ thống.',
    interviewers: [
      {
        id: 'interviewer-n-david',
        name: 'David L.',
        role: 'Principal Streaming Architect @ N***',
        avatarIcon: '👨‍💼',
        companyId: 'company-n',
        bio: 'Chuyên gia tối ưu hóa streaming latency thấp và kiến trúc event-driven microservices với hơn 10 năm kinh nghiệm.',
        welcomeGreeting: 'Hello bạn! Chào mừng bạn tới buổi phỏng vấn tại N***. Ở đây chúng mình yêu thích những giải pháp đơn giản, bền bỉ và có khả năng chịu tải hàng triệu stream đồng thời.',
        positiveReaction: 'Tuyệt đỉnh! Phân tích của bạn rất mạch lạc, giải quyết triệt để vấn đề latency và network overhead.',
        neutralReaction: 'Ý tưởng hợp lý. Tuy nhiên hãy lưu ý đến vấn đề timeout và rủi ro cascade failure nếu một dependency gặp sự cố.',
        constructiveReaction: 'Điểm mấu chốt ở đây là bạn cần kiểm soát được trạng thái kết nối và cơ chế retry có backoff.',
        hintPrefix: 'Gợi ý từ David: Hãy liên tưởng đến mô hình mạng OSI và cách HTTP headers hay TCP keep-alive ảnh hưởng tới hiệu năng nhé.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'n-qa-1',
        question: 'Môi trường kỹ thuật tại N*** có gì khác biệt so với các công ty khác?',
        interviewerAnswer: 'Chúng mình không áp đặt quy trình rườm rà. Bạn có toàn quyền chọn giải pháp kỹ thuật tối ưu nhất, nhưng đổi lại bạn chịu trách nhiệm hoàn toàn về độ tin cậy và uptime của dịch vụ mình phụ trách.'
      }
    ]
  },
  {
    id: 'company-m',
    maskedName: 'M***',
    realWorldHint: 'Tập đoàn Công nghệ Đa Quốc gia • Enterprise Cloud & Social Scale',
    badgeColor: '#10b981',
    badgeBgDark: 'rgba(16, 185, 129, 0.15)',
    badgeBgLight: '#dcfce7',
    badgeBorder: '#86efac',
    tagline: 'Growth Mindset • Hệ Thống Doanh Nghiệp & Quy Mô Tỷ Người Dùng',
    description: 'Đánh giá cao tư duy học hỏi không ngừng (Growth Mindset), khả năng viết mã chuẩn mực, kiến trúc hướng module và bảo mật nghiêm ngặt.',
    preferredTopics: ['Java Backend', 'Database'],
    cultureAndBarRaiserTip: 'Hãy thể hiện rõ tư duy giải thích mạch lạc, phân biệt rõ các khái niệm trừu tượng và liên hệ với các mẫu thiết kế (Design Patterns) phổ biến.',
    interviewers: [
      {
        id: 'interviewer-m-minh',
        name: 'Minh Hoàng',
        role: 'Lead Software Engineer @ M***',
        avatarIcon: '👨‍💻',
        companyId: 'company-m',
        bio: 'Cựu quán quân Olympic Tin học, hiện đang dẫn dắt đội ngũ kỹ thuật phát triển dịch vụ lưu trữ dữ liệu quy mô lớn.',
        welcomeGreeting: 'Chào bạn! Mình là Minh từ M***. Rất mong muốn được lắng nghe cách bạn tiếp cận và giải quyết các bài toán kỹ thuật hôm nay.',
        positiveReaction: 'Rất chuẩn xác! Bạn trình bày rất có cấu trúc, từ định nghĩa đến ví dụ cụ thể.',
        neutralReaction: 'Bạn nắm được ý chính rồi, hãy cố gắng bổ sung thêm phần kinh nghiệm thực tế khi triển khai để bài nói có chiều sâu hơn.',
        constructiveReaction: 'Chưa chính xác lắm ở chi tiết kỹ thuật này. Nhưng không sao, ta cùng nhau gỡ rối nhé.',
        hintPrefix: 'Gợi ý từ Minh: Hãy chú ý tới tính bất biến (Immutability) và cơ chế khóa đồng bộ khi làm việc đa luồng.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'm-qa-1',
        question: 'Văn hóa "Growth Mindset" tại M*** được thể hiện như thế nào trong công việc hàng ngày?',
        interviewerAnswer: 'Ở M***, thất bại hay bug không bị khiển trách mà được coi là cơ hội học tập. Sau mỗi sự cố, cả team cùng làm Post-Mortem không phán xét để tìm nguyên nhân gốc rễ và nâng cấp hệ thống.'
      }
    ]
  },
  {
    id: 'company-s',
    maskedName: 'S***',
    realWorldHint: 'Kỳ Lân Thương Mại Điện Tử & FinTech Hàng Đầu Đông Nam Á',
    badgeColor: '#f97316',
    badgeBgDark: 'rgba(249, 115, 22, 0.15)',
    badgeBgLight: '#ffedd5',
    badgeBorder: '#fdba74',
    tagline: 'High QPS Flash Sale • Xử Lý Đơn Hàng & Giao Dịch Bất Tử',
    description: 'Nổi tiếng với những chiến dịch siêu sale 11.11, 12.12 với lưu lượng hàng triệu QPS. Phỏng vấn tại S*** tập trung cao độ vào Database, Transaction, Caching và Concurrency.',
    preferredTopics: ['Database', 'Spring Boot'],
    cultureAndBarRaiserTip: 'Các câu hỏi tại S*** luôn xoay quanh câu chuyện "Làm sao để hệ thống không sập khi 10.000 user cùng bấm mua 1 món hàng trong 1 giây?".',
    interviewers: [
      {
        id: 'interviewer-s-huy',
        name: 'Huy Đặng',
        role: 'Tech Lead High-Concurrency Core @ S***',
        avatarIcon: '👨‍💻',
        companyId: 'company-s',
        bio: '6 năm chiến đấu cùng hệ thống thanh toán và giỏ hàng Flash Sale tại S***, xử lý đỉnh điểm 250.000 đơn hàng/phút.',
        welcomeGreeting: 'Chào bạn! Mình là Huy từ S***. Hôm nay mình sẽ cùng bạn thảo luận về những bài toán backend thực tế, đặc biệt là cách xử lý dữ liệu chuẩn xác dưới áp lực tải lớn!',
        positiveReaction: 'Chuẩn không cần chỉnh! Bạn hiểu rất rõ về Transaction Isolation và cách tránh Deadlock, đúng tố chất kỹ sư Flash Sale.',
        neutralReaction: 'Giải pháp này ổn cho tải nhẹ, nhưng với tải 100.000 request/giây thì database sẽ bị lock contention nghiêm trọng. Cần thêm cơ chế cache hoặc queue.',
        constructiveReaction: 'Lưu ý rằng việc thiếu kiểm soát lock ở đây sẽ dẫn tới hiện tượng bán quá số lượng (overselling) ngay lập tức!',
        hintPrefix: 'Gợi ý từ Huy: Hãy nhớ về nguyên lý Optimistic Lock (Version) và cách Database B-Tree Index tra cứu dữ liệu.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 's-qa-1',
        question: 'Thách thức lớn nhất đối với một kỹ sư backend mới gia nhập S*** là gì?',
        interviewerAnswer: 'Đó là quy mô dữ liệu và áp lực tốc độ! Một query chậm 50ms có thể gây nghẽn toàn bộ luồng checkout. Bạn sẽ được học cách dùng Explain Plan, Redis caching và xử lý bất đồng bộ triệt để.'
      }
    ]
  },
  {
    id: 'company-v',
    maskedName: 'V***',
    realWorldHint: 'Kỳ Lân Công Nghệ Việt Nam • Hệ Sinh Thái Gaming, Thanh Toán & Cloud',
    badgeColor: '#8b5cf6',
    badgeBgDark: 'rgba(139, 92, 246, 0.15)',
    badgeBgLight: '#f3e8ff',
    badgeBorder: '#c084fc',
    tagline: 'Product Mindset • Hệ Thống Thanh Toán & Dịch Vụ Hàng Chục Triệu Người Dùng',
    description: 'Phỏng vấn tại V*** kết hợp hài hòa giữa kiến thức CS nền tảng, sự am hiểu sâu về Java/Spring và tư duy tạo ra sản phẩm ổn định, thân thiện với người dùng Việt Nam.',
    preferredTopics: ['Spring Boot', 'Java Backend'],
    cultureAndBarRaiserTip: 'Nhấn mạnh tính cẩn trọng, khả năng làm việc nhóm và tư duy bảo mật dữ liệu khách hàng trong từng dòng mã.',
    interviewers: [
      {
        id: 'interviewer-v-phuong',
        name: 'Phương Vũ',
        role: 'Principal Backend Lead @ V***',
        avatarIcon: '👩‍💻',
        companyId: 'company-v',
        bio: '9 năm phát triển cổng thanh toán điện tử và hệ thống xác thực tập trung với độ sẵn sàng cao 99.99%.',
        welcomeGreeting: 'Chào em! Chị là Phương từ V***. Buổi hôm nay là cơ hội để hai chị em cùng chia sẻ về kỹ năng backend và kinh nghiệm lập trình. Em cứ tự tin trả lời nhé!',
        positiveReaction: 'Em trả lời rất tự tin và chặt chẽ! Nắm rất vững các tầng kiến trúc và bảo vệ dữ liệu.',
        neutralReaction: 'Câu trả lời khá ổn, nếu em chú ý thêm phần logging và giám sát lỗi tập trung thì sẽ hoàn hảo hơn.',
        constructiveReaction: 'Chỗ này mình cần cẩn trọng hơn về bảo mật và xử lý rollback khi có exception xảy ra nhé.',
        hintPrefix: 'Gợi ý từ Phương: Hãy liên tưởng đến cơ chế Exception Handling toàn cục và vòng đời của một Spring Bean.',
        gender: 'female'
      }
    ],
    candidateQA: [
      {
        id: 'v-qa-1',
        question: 'Môi trường làm việc và văn hóa phát triển con người tại V*** có điểm gì nổi bật?',
        interviewerAnswer: 'V*** có chương trình đào tạo kỹ sư trẻ rất bài bản. Bạn được các anh chị Senior kèm cặp, tham gia các buổi Tech Talk nội bộ hàng tuần và có lộ trình thăng tiến kỹ thuật (Tech Track) rất rõ ràng.'
      }
    ]
  },
  {
    id: 'company-t',
    maskedName: 'T***',
    realWorldHint: 'Nền tảng Video Ngắn & Thuật Toán Gợi Ý Triệu QPS Toàn Cầu',
    badgeColor: '#ec4899',
    badgeBgDark: 'rgba(236, 72, 153, 0.15)',
    badgeBgLight: '#fce7f3',
    badgeBorder: '#f472b6',
    tagline: 'Hyper Scale Feeds • Xử Lý Stream Bất Đồng Bộ & Độ Trễ Milli-giây',
    description: 'Quy trình tuyển dụng tập trung vào tư duy thuật toán, cấu trúc dữ liệu, khả năng viết code không lỗi và hiểu biết về Network, Event Stream.',
    preferredTopics: ['Java Backend', 'Network'],
    cultureAndBarRaiserTip: 'Ở T***, tốc độ và độ chính xác là chìa khóa. Hãy thể hiện khả năng xử lý bài toán stream dữ liệu lớn với độ trễ thấp nhất.',
    interviewers: [
      {
        id: 'interviewer-t-kien',
        name: 'Kiên Bùi',
        role: 'Staff Infrastructure Lead @ T***',
        avatarIcon: '👨‍💻',
        companyId: 'company-t',
        bio: '7 năm tối ưu hóa luồng phân phối video và feed recommendation phục vụ hàng trăm triệu DAU.',
        welcomeGreeting: 'Chào bạn! Mình là Kiên từ T***. Hôm nay chúng ta sẽ cùng đào sâu vào cách tối ưu code và xử lý luồng dữ liệu ở quy mô siêu lớn nhé!',
        positiveReaction: 'Rất ấn tượng! Bạn tối ưu hóa việc phân bổ bộ nhớ và giảm tải I/O rất khéo léo.',
        neutralReaction: 'Giải pháp tạm ổn, nhưng bạn cần tính đến việc connection pooling và thread contention khi số lượng request đồng thời tăng vọt.',
        constructiveReaction: 'Ở quy mô của T***, giải pháp này sẽ tạo ra độ trễ hàng trăm mili-giây. Cùng tư duy lại cách dùng cache và bất đồng bộ nhé.',
        hintPrefix: 'Gợi ý từ Kiên: Hãy liên hệ tới mô hình Non-blocking I/O và cách chia tải giữa các Worker Thread.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 't-qa-1',
        question: 'Làm việc tại T*** đòi hỏi kỹ sư backend có mindset như thế nào?',
        interviewerAnswer: 'Đó là mindset "Data-Driven" và "Obsessed with Latency". Bạn sẽ được đo lường hiệu năng của từng dòng code bằng hệ thống profiling real-time và APM chi tiết.'
      }
    ]
  },
  {
    id: 'company-f',
    maskedName: 'F***',
    realWorldHint: 'Tập Đoàn Dịch Vụ Công Nghệ & Phần Mềm Toàn Cầu Hàng Đầu Việt Nam',
    badgeColor: '#059669',
    badgeBgDark: 'rgba(5, 150, 105, 0.15)',
    badgeBgLight: '#d1fae5',
    badgeBorder: '#6ee7b7',
    tagline: 'Global Delivery Standard • Clean Architecture & Doanh Nghiệp Quốc Tế',
    description: 'Phỏng vấn chuẩn mực theo tiêu chuẩn quốc tế cho các dự án ngân hàng, hàng không, logistics tại Nhật, Mỹ, châu Âu.',
    preferredTopics: ['Java Backend', 'Spring Boot'],
    cultureAndBarRaiserTip: 'Nhấn mạnh tính chuẩn mực trong quy trình (Clean Architecture, SOLID, Design Patterns, Unit Testing coverage cao và bảo mật).',
    interviewers: [
      {
        id: 'interviewer-f-thao',
        name: 'Thảo Trần',
        role: 'Senior Solutions Architect @ F***',
        avatarIcon: '👩‍💼',
        companyId: 'company-f',
        bio: '8 năm thiết kế kiến trúc backend cho các dự án chuyển đổi số ngân hàng và bảo hiểm tại thị trường Nhật Bản và Singapore.',
        welcomeGreeting: 'Chào em! Chị là Thảo từ F***. Chúc em có một buổi phỏng vấn thật tự tin và thể hiện trọn vẹn kiến thức chuyên môn của mình nhé!',
        positiveReaction: 'Tuyệt vời! Kiến trúc và tư duy OOP của em rất chuẩn chỉ, tuân thủ chặt chẽ các nguyên lý thiết kế.',
        neutralReaction: 'Em nêu được logic cơ bản, nhưng cần chú ý đến quy ước đặt tên và xử lý các trường hợp biên (edge cases) chuẩn chỉnh hơn.',
        constructiveReaction: 'Điểm này chưa đạt chuẩn kiểm thử và tính đóng gói. Chị gợi ý em xem lại nguyên lý SOLID nhé.',
        hintPrefix: 'Gợi ý từ Thảo: Hãy áp dụng nguyên lý Dependency Inversion và xem xét cách Spring IoC quản lý vòng đời Bean.',
        gender: 'female'
      }
    ],
    candidateQA: [
      {
        id: 'f-qa-1',
        question: 'Cơ hội làm việc với khách hàng toàn cầu và thăng tiến tại F*** cho các bạn trẻ như thế nào?',
        interviewerAnswer: 'F*** có chương trình Global Onsite rất rộng mở (Nhật, Mỹ, Châu Âu, Singapore). Nếu bạn vững kỹ thuật và có ngoại ngữ tốt, cơ hội được cử đi onsite và dẫn dắt module độc lập là rất lớn.'
      }
    ]
  },
  {
    id: 'company-o',
    maskedName: 'O***',
    realWorldHint: 'Tập Đoàn Phần Mềm Doanh Nghiệp, Cơ Sở Dữ Liệu & Nhà Phát Triển Ngôn Ngữ Java',
    badgeColor: '#dc2626',
    badgeBgDark: 'rgba(220, 38, 38, 0.15)',
    badgeBgLight: '#fee2e2',
    badgeBorder: '#f87171',
    tagline: 'Database Engine Standards • JVM Internals & Enterprise Reliability',
    description: 'Nơi định hình tiêu chuẩn Java toàn cầu và cơ sở dữ liệu quan hệ doanh nghiệp. Phỏng vấn tập trung sâu vào JVM Specification, Memory Model, Garbage Collection và Transaction Engine.',
    preferredTopics: ['Java Backend', 'Database'],
    cultureAndBarRaiserTip: 'Ở O***, câu hỏi sẽ đi thẳng vào tầng máy ảo (JVM bytecode, Metaspace, JIT Compiler, B-Tree Page Storage). Hãy giải thích chính xác từ góc nhìn kiến trúc máy tính.',
    interviewers: [
      {
        id: 'interviewer-o-eric',
        name: 'Eric Phạm',
        role: 'Principal JVM Architect @ O***',
        avatarIcon: '👨‍💼',
        companyId: 'company-o',
        bio: '10 năm đóng góp vào hệ sinh thái Java Platform và tối ưu hóa hiệu năng cơ sở dữ liệu quan hệ cho các ngân hàng trung ương.',
        welcomeGreeting: 'Chào bạn! Mình là Eric từ O***. Rất vui được trao đổi với bạn hôm nay về bản chất của Java và lưu trữ dữ liệu. Hãy cùng mổ xẻ những vấn đề kỹ thuật sâu sắc nhất nhé!',
        positiveReaction: 'Tuyệt vời! Bạn nắm rất vững tầng JVM và cách Database tổ chức trang nhớ trên đĩa, hoàn toàn đáp ứng kỳ vọng kỹ sư tại O***.',
        neutralReaction: 'Câu trả lời của bạn đúng về mặt lý thuyết thông thường, nhưng cần phân tích sâu hơn về tác động tới Garbage Collection và Disk I/O.',
        constructiveReaction: 'Ở tầng hệ thống của O***, cách tiếp cận này sẽ gây lãng phí Heap hoặc khóa dòng dữ liệu quá lâu. Cùng xem xét lại bản chất nhé!',
        hintPrefix: 'Gợi ý từ Eric: Hãy liên hệ tới cách Garbage Collector (G1 / ZGC) thu gom các thế hệ đối tượng và cách Index tra cứu dữ liệu.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'o-qa-1',
        question: 'Làm việc tại O*** giúp một kỹ sư trẻ hiểu sâu về công nghệ lõi như thế nào?',
        interviewerAnswer: 'Tại O***, bạn được tiếp xúc trực tiếp với mã nguồn của Java Virtual Machine và database engine. Bạn sẽ không chỉ học cách "dùng" thư viện mà học cách "tạo ra" các tiêu chuẩn phần mềm toàn cầu.'
      }
    ]
  },
  {
    id: 'company-u',
    maskedName: 'U***',
    realWorldHint: 'Nền Tảng Điều Phối Di Chuyển & Logistics Thời Gian Thực Toàn Cầu',
    badgeColor: '#000000',
    badgeBgDark: 'rgba(255, 255, 255, 0.12)',
    badgeBgLight: '#f1f5f9',
    badgeBorder: '#94a3b8',
    tagline: 'Real-Time Dispatching • Geohashing & Microservices Resiliency',
    description: 'Xử lý hàng triệu cuốc xe và chuyến giao hàng mỗi giây với bài toán định vị không gian (Geohash), thuật toán gán chuyến và microservices chịu lỗi cao.',
    preferredTopics: ['Network', 'Database'],
    cultureAndBarRaiserTip: 'U*** đánh giá cao tư duy xử lý thời gian thực (Real-Time), xử lý sự cố rớt mạng của tài xế và khả năng phục hồi dữ liệu khi node gặp sự cố.',
    interviewers: [
      {
        id: 'interviewer-u-linh',
        name: 'Linh Đặng',
        role: 'Senior Distributed Systems Lead @ U***',
        avatarIcon: '👩‍💻',
        companyId: 'company-u',
        bio: '7 năm xây dựng hệ thống dispatching và dynamic pricing xử lý hàng chục nghìn transaction mỗi giây trên khắp các châu lục.',
        welcomeGreeting: 'Hello bạn! Mình là Linh từ U***. Buổi phỏng vấn hôm nay sẽ xoay quanh cách xây dựng dịch vụ chịu tải lớn và hoạt động ổn định 24/7. Cứ tự tin chia sẻ nhé!',
        positiveReaction: 'Rất ấn tượng! Bạn đã xử lý bài toán race condition và độ trễ mạng rất thông minh, chuẩn phong cách kỹ sư U***.',
        neutralReaction: 'Ý tưởng ổn, nhưng bạn chưa tính tới trường hợp mất mạng (network partition) hoặc sự cố đồng bộ vị trí giữa các worker node.',
        constructiveReaction: 'Trong môi trường điều phối thời gian thực, độ trễ này là quá lớn. Cần tối ưu lại cấu trúc dữ liệu và giảm thiểu serialization overhead.',
        hintPrefix: 'Gợi ý từ Linh: Hãy suy nghĩ về việc phân vùng dữ liệu theo khu vực địa lý và cách caching dữ liệu tạm thời trong bộ nhớ RAM.',
        gender: 'female'
      }
    ],
    candidateQA: [
      {
        id: 'u-qa-1',
        question: 'Vấn đề kỹ thuật thú vị nhất mà các kỹ sư tại U*** đối mặt là gì?',
        interviewerAnswer: 'Đó là bài toán ghép cặp thời gian thực (Real-Time Matching): làm sao gán đúng tài xế cho đúng hành khách trong vòng dưới 200 mili-giây với chi phí tính toán tối ưu nhất.'
      }
    ]
  },
  {
    id: 'company-l',
    maskedName: 'L***',
    realWorldHint: 'Mạng Xã Hội Nghề Nghiệp Hàng Đầu • Nơi Khai Sinh Apache Kafka & Data Streams',
    badgeColor: '#0284c7',
    badgeBgDark: 'rgba(2, 132, 199, 0.15)',
    badgeBgLight: '#e0f2fe',
    badgeBorder: '#38bdf8',
    tagline: 'Economic Graph • Event Streaming & Distributed Log Architecture',
    description: 'Nơi phát minh ra Apache Kafka. Phỏng vấn tại L*** tập trung vào mô hình Event-Driven, kiến trúc đồ thị quan hệ quy mô lớn và xử lý dữ liệu hàng tỷ kết nối.',
    preferredTopics: ['Java Backend', 'Network'],
    cultureAndBarRaiserTip: 'Hãy nhấn mạnh tư duy kiến trúc bất đồng bộ (Asynchronous), phân tách rõ ràng giữa luồng ghi (Ingestion) và luồng phân tích (Analytics).',
    interviewers: [
      {
        id: 'interviewer-l-phong',
        name: 'Phong Nguyễn',
        role: 'Staff Data Platform Engineer @ L***',
        avatarIcon: '👨‍💻',
        companyId: 'company-l',
        bio: '8 năm thiết kế nền tảng event streaming và pub/sub tại L***, phục vụ xử lý hơn 7.000 tỷ message mỗi ngày.',
        welcomeGreeting: 'Chào bạn! Mình là Phong từ L***. Rất mong muốn được lắng nghe cách bạn thiết kế các luồng dữ liệu bền bỉ và mở rộng được. Cùng bắt đầu nhé!',
        positiveReaction: 'Cực kỳ chính xác! Bạn hiểu sâu sắc về luồng append-only log và cách giải phóng tài nguyên I/O hiệu quả.',
        neutralReaction: 'Giải pháp chạy được nhưng nếu message rate tăng gấp 10 lần thì hệ thống sẽ bị nghẽn ở bước tuần tự hóa. Cần tối ưu thêm.',
        constructiveReaction: 'Chỗ này có nguy cơ mất mát thông điệp nếu broker bị crash. Bạn cần cân nhắc kỹ về cơ chế ACK và idempotency.',
        hintPrefix: 'Gợi ý từ Phong: Hãy liên tưởng đến mô hình Publisher-Subscriber, Zero-Copy buffer và cách hệ điều hành ghi dữ liệu vào Page Cache.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'l-qa-1',
        question: 'Tại L***, các kỹ sư backend học hỏi được gì nhiều nhất từ nền tảng dữ liệu khổng lồ?',
        interviewerAnswer: 'Bạn sẽ học được tư duy "Data at Scale" — mọi dòng code bạn viết ra đều phải chạy được khi số lượng người dùng tăng từ 1 triệu lên 1 tỷ mà không làm suy giảm hiệu năng.'
      }
    ]
  },
  {
    id: 'company-s-fintech',
    maskedName: 'S***',
    realWorldHint: 'Nền Tảng Hạ Tầng Thanh Toán Tài Chính Toàn Cầu (FinTech API Giant)',
    badgeColor: '#6366f1',
    badgeBgDark: 'rgba(99, 102, 241, 0.15)',
    badgeBgLight: '#e0e7ff',
    badgeBorder: '#a5b4fc',
    tagline: 'Financial Infrastructure • Idempotency & Độ Tin Cậy 99.999% Tuyệt Đối',
    description: 'Tiêu chuẩn vàng của ngành phần mềm về API Design, tính lũy đẳng (Idempotency Key), Zero Data Loss và phân tầng xử lý giao dịch tài chính.',
    preferredTopics: ['Spring Boot', 'Database'],
    cultureAndBarRaiserTip: 'Trong ngành thanh toán, không bao giờ được phép trừ tiền hai lần của khách hàng! Bạn phải luôn nắm chắc cơ chế Idempotency và Distributed Transaction.',
    interviewers: [
      {
        id: 'interviewer-s-bao',
        name: 'Bảo Lê',
        role: 'Senior Payment Infrastructure Lead @ S***',
        avatarIcon: '👨‍💼',
        companyId: 'company-s-fintech',
        bio: '6 năm xây dựng hệ thống thanh toán xuyên biên giới với độ sẵn sàng cao 99.999%, xử lý hàng trăm tỷ USD giao dịch mỗi năm.',
        welcomeGreeting: 'Chào bạn! Mình là Bảo từ S***. Trong hệ thống tài chính, sự chính xác và an toàn là tuyệt đối. Hãy cùng mình trao đổi về cách viết code không thể sai sót nhé!',
        positiveReaction: 'Quá xuất sắc! Bạn đã lồng ghép tính lũy đẳng (Idempotency) và quản lý transaction rất an toàn, chuẩn tinh thần kỹ sư S***.',
        neutralReaction: 'Ý tưởng khả thi, nhưng nếu mạng bị timeout ở giữa chừng thì bạn xử lý việc hoàn tiền (reconciliation) ra sao? Cần làm rõ thêm.',
        constructiveReaction: 'Đây là lỗi nguy hiểm trong hệ thống thanh toán: request gửi lại sẽ bị nhân đôi giao dịch. Bạn cần khóa theo Idempotency Key ngay lập tức!',
        hintPrefix: 'Gợi ý từ Bảo: Hãy nhớ tới khóa duy nhất Idempotency-Key và cách xử lý phân tán 2-Phase Commit hoặc Saga Pattern.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 's-fin-qa-1',
        question: 'Tại sao S*** lại nổi tiếng về chất lượng API và tài liệu kỹ thuật trên toàn thế giới?',
        interviewerAnswer: 'Bởi vì triết lý của chúng mình là "Developer First" — mỗi endpoint API đều được thiết kế tỉ mỉ như một tác phẩm nghệ thuật, mã lỗi rõ ràng và có độ tin cậy tuyệt đối.'
      }
    ]
  },
  {
    id: 'company-g-ride',
    maskedName: 'G***',
    realWorldHint: 'Siêu Ứng Dụng Đông Nam Á (Gọi Xe, Giao Thức Ăn & Thanh Toán Điện Tử)',
    badgeColor: '#10b981',
    badgeBgDark: 'rgba(16, 185, 129, 0.15)',
    badgeBgLight: '#dcfce7',
    badgeBorder: '#86efac',
    tagline: 'Hyper-Local Superapp • Dispatching & Thanh Toán Vi Mô Tốc Độ Cao',
    description: 'Phục vụ hàng chục triệu người dân Đông Nam Á trong việc di chuyển và ăn uống mỗi ngày. Phỏng vấn chú trọng tính thực chiến, Spring Boot microservices và caching phân tán.',
    preferredTopics: ['Spring Boot', 'Database'],
    cultureAndBarRaiserTip: 'Các câu hỏi tại G*** nhấn mạnh vào sự thích ứng linh hoạt, xử lý độ trễ mạng di động 4G/5G chập chờn và khả năng tối ưu hóa chi phí đám mây.',
    interviewers: [
      {
        id: 'interviewer-g-nam',
        name: 'Nam Vũ',
        role: 'Lead Core Dispatch Engineer @ G***',
        avatarIcon: '👨‍💻',
        companyId: 'company-g-ride',
        bio: '7 năm phát triển dịch vụ đặt xe và gán cuốc tự động cho đội ngũ hàng trăm nghìn tài xế tại Việt Nam, Singapore và Indonesia.',
        welcomeGreeting: 'Chào bạn! Mình là Nam từ G***. Rất vui được gặp bạn hôm nay. Bọn mình thích những giải pháp đơn giản, hiệu quả và có thể đưa ngay vào thực tế!',
        positiveReaction: 'Rất tuyệt! Bạn có tư duy thực chiến sắc bén, giải quyết gọn ghẽ bài toán tải cao của ứng dụng gọi xe.',
        neutralReaction: 'Cách làm này tạm được, nhưng khi lượng cuốc tăng vọt vào giờ cao điểm trời mưa thì DB sẽ bị quá tải nếu thiếu Redis cache.',
        constructiveReaction: 'Điểm này sẽ làm treo ứng dụng của tài xế khi nhận thông báo. Bạn cần chuyển sang xử lý bất đồng bộ bằng message queue nhé.',
        hintPrefix: 'Gợi ý từ Nam: Hãy nghĩ đến cơ chế Caching kết hợp hàng đợi bất đồng bộ để bảo vệ database chính.',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'g-ride-qa-1',
        question: 'Môi trường kỹ thuật tại G*** giúp kỹ sư phát triển tư duy sản phẩm như thế nào?',
        interviewerAnswer: 'Tại G***, mỗi kỹ sư đều được khuyến khích "trải nghiệm như khách hàng". Bạn viết code cho chính tài xế và quán ăn mà bạn gặp mỗi ngày trên đường, cảm giác giải quyết bài toán thực tế rất rõ ràng.'
      }
    ]
  },
  {
    id: 'company-z',
    maskedName: 'Z***',
    realWorldHint: 'Nền Tảng Nhắn Tin & Siêu Ứng Dụng Hàng Đầu Việt Nam (75+ Triệu Người Dùng)',
    badgeColor: '#0284c7',
    badgeBgDark: 'rgba(2, 132, 199, 0.15)',
    badgeBgLight: '#e0f2fe',
    badgeBorder: '#38bdf8',
    tagline: 'Instant Messaging • Kết Nối Đồng Thời Hàng Triệu WebSocket & TCP',
    description: 'Ứng dụng nhắn tin quốc dân tại Việt Nam. Phỏng vấn đào sâu vào khả năng tối ưu hóa bộ nhớ kết nối (Memory Footprint), WebSocket, Push Notification và truyền tải tin nhắn độ trễ cực thấp.',
    preferredTopics: ['Java Backend', 'Network'],
    cultureAndBarRaiserTip: 'Nhấn mạnh vào khả năng giữ kết nối trực tuyến của hàng chục triệu người dùng đồng thời (C1000K Problem) với lượng RAM tiêu tốn ít nhất.',
    interviewers: [
      {
        id: 'interviewer-z-tuan',
        name: 'Tuấn Hoàng',
        role: 'Principal IM Architect @ Z***',
        avatarIcon: '👨‍💻',
        companyId: 'company-z',
        bio: '9 năm thiết kế kiến trúc truyền thông tin nhắn thời gian thực và đồng bộ dữ liệu đám mây phục vụ hơn 75 triệu người dùng hoạt động hàng tháng.',
        welcomeGreeting: 'Chào em! Anh là Tuấn từ Z***. Hôm nay anh em mình sẽ cùng trao đổi về cách giữ cho hệ thống nhắn tin luôn nhanh và mượt mà dù đang có bão tin nhắn chúc Tết!',
        positiveReaction: 'Rất xuất sắc! Em hiểu rất rõ về TCP socket và cách tiết kiệm bộ nhớ cho từng connection, đúng chuẩn kỹ sư hệ thống Z***.',
        neutralReaction: 'Thuật toán của em chạy được, nhưng nếu có 1 triệu người online cùng lúc thì lượng con trỏ trên Heap sẽ gây áp lực lớn lên Garbage Collection.',
        constructiveReaction: 'Điểm này sẽ làm tin nhắn bị gửi chậm vài giây khi mạng yếu. Cần thiết kế lại cơ chế gửi ACK và buffer gói tin nhé.',
        hintPrefix: 'Gợi ý từ Tuấn: Hãy chú ý tới mô hình Non-blocking I/O (Netty/NIO) và cách tối ưu hóa byte buffer không cần copy (Zero-Copy).',
        gender: 'male'
      }
    ],
    candidateQA: [
      {
        id: 'z-qa-1',
        question: 'Thách thức kỹ thuật lớn nhất khi phục vụ 75 triệu người dùng tại Việt Nam là gì?',
        interviewerAnswer: 'Đó là những khoảnh khắc giao thừa hay sự kiện lớn — lưu lượng tin nhắn có thể tăng vọt gấp 20 lần trong vài phút. Hệ thống phải tự động đàn hồi và không bao giờ được phép mất tin nhắn của người dùng.'
      }
    ]
  }
];

export const MOCK_INTERVIEW_DISCLAIMER = {
  shortText: 'Miễn trừ trách nhiệm: Mọi nội dung, định dạng câu hỏi và đánh giá trong phòng phỏng vấn thử đều mang tính chất học tập & tham khảo, không đại diện hoặc phản ánh chính xác 100% quy trình tuyển dụng thực tế của bất kỳ doanh nghiệp nào.',
  fullText: '⚠️ Tuyên bố miễn trừ trách nhiệm (Educational Disclaimer): Phòng phỏng vấn thử nghiệm này được thiết kế hoàn toàn cho mục đích giáo dục, ôn luyện kiến thức kỹ thuật và rèn luyện phản xạ phỏng vấn cho cộng đồng lập trình viên. Tên các doanh nghiệp được mã hóa, các tiêu chí đánh giá và phong cách câu hỏi đều là sự mô phỏng độc lập mang tính tham khảo, không đồng nghĩa, đại diện hay cam kết tương đồng với các vòng phỏng vấn tuyển dụng chính thức của các công ty ngoài đời thực.'
};

export function getCompanyById(companyId: string): MaskedCompany {
  const found = MASKED_COMPANIES.find((c) => c.id === companyId);
  return found || MASKED_COMPANIES[0];
}

export function getRandomCompany(): MaskedCompany {
  const randomIndex = Math.floor(Math.random() * MASKED_COMPANIES.length);
  return MASKED_COMPANIES[randomIndex];
}

