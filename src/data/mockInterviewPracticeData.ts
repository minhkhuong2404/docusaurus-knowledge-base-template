/**
 * Practice data for the Mock Interview Studio:
 *  1. Behavioral (STAR) round questions + heuristic STAR evaluator
 *  2. Rapid-Fire lightning round (true/false myth busting)
 *  3. Practice history helpers (persisted in localStorage)
 */

export interface BehavioralQuestion {
  id: string;
  companyHint: string;
  competency: string;
  question: string;
  whatInterviewerSeeks: string;
  sampleStarAnswer: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: 'bq-conflict-teammate',
    companyHint: 'A*** (Leadership Principles)',
    competency: 'Teamwork & Conflict Resolution',
    question: 'Hãy kể về một lần bạn bất đồng quan điểm kỹ thuật với thành viên khác trong nhóm (đồ án, dự án cá nhân hoặc công ty). Bạn đã xử lý thế nào?',
    whatInterviewerSeeks: 'Khả năng "Disagree and Commit": tranh luận dựa trên dữ liệu thay vì cảm tính, tôn trọng đồng đội và cam kết thực hiện quyết định chung.',
    sampleStarAnswer: {
      situation: 'Trong đồ án tốt nghiệp nhóm 4 người, bạn em muốn lưu toàn bộ dữ liệu đơn hàng vào MongoDB, còn em đề xuất PostgreSQL vì dữ liệu có quan hệ chặt chẽ và cần transaction.',
      task: 'Em cần thống nhất lựa chọn database trong 2 ngày để không làm chậm tiến độ sprint đầu tiên.',
      action: 'Em đề xuất cả hai cùng viết một prototype nhỏ cho luồng đặt hàng, đo thời gian truy vấn và kiểm tra tính nhất quán khi 2 người cùng đặt sản phẩm cuối cùng. Sau đó em trình bày bảng so sánh trade-off cho cả nhóm biểu quyết.',
      result: 'Nhóm chọn PostgreSQL; prototype cho thấy MongoDB cần tự xử lý race condition. Bạn em vẫn dùng MongoDB cho phần log hoạt động. Đồ án đạt 9.2 điểm và hai bọn em vẫn làm việc rất ăn ý.'
    }
  },
  {
    id: 'bq-production-mistake',
    companyHint: 'G*** (Googleyness & Ownership)',
    competency: 'Ownership & Learning from Failure',
    question: 'Kể về một sai lầm lớn nhất bạn từng mắc phải khi lập trình. Bạn đã làm gì sau đó?',
    whatInterviewerSeeks: 'Sự trung thực, chủ động nhận trách nhiệm, khắc phục nhanh và quan trọng nhất là cơ chế phòng ngừa để lỗi không lặp lại (blameless postmortem).',
    sampleStarAnswer: {
      situation: 'Khi thực tập, em chạy script cập nhật dữ liệu trên môi trường staging nhưng quên điều kiện WHERE, làm sai trạng thái của 3.000 đơn hàng test mà team QA đang dùng.',
      task: 'Em phải khôi phục dữ liệu nhanh nhất để QA không bị chặn việc kiểm thử bản release cuối tuần.',
      action: 'Em báo ngay cho mentor trong 5 phút, khôi phục từ bản backup gần nhất, sau đó viết lại script có bước dry-run đếm số dòng bị ảnh hưởng và bọc trong transaction để có thể rollback.',
      result: 'Dữ liệu được khôi phục sau 40 phút. Em đề xuất checklist chạy script bắt buộc có dry-run và review chéo; team áp dụng và từ đó không còn sự cố tương tự.'
    }
  },
  {
    id: 'bq-learn-new-tech',
    companyHint: 'N*** (Learn & Grow)',
    competency: 'Learning Agility',
    question: 'Kể về một lần bạn phải học một công nghệ hoàn toàn mới trong thời gian rất ngắn để hoàn thành công việc.',
    whatInterviewerSeeks: 'Phương pháp tự học có hệ thống (đọc docs chính thức, làm POC, hỏi đúng người) và khả năng biến kiến thức mới thành kết quả cụ thể.',
    sampleStarAnswer: {
      situation: 'Dự án môn học yêu cầu tích hợp thông báo real-time, nhưng cả nhóm chưa ai từng dùng WebSocket.',
      task: 'Em nhận nhiệm vụ hoàn thành tính năng chat real-time trong vòng 1 tuần.',
      action: 'Em đọc tài liệu chính thức Spring WebSocket/STOMP trong 2 ngày đầu, dựng một POC chat tối giản, sau đó viết tài liệu ngắn hướng dẫn cả nhóm và bổ sung cơ chế reconnect khi mất mạng.',
      result: 'Tính năng hoàn thành sớm 1 ngày, hỗ trợ 50 người dùng đồng thời trong buổi demo mà không mất tin nhắn. Tài liệu của em được thầy dùng làm tham khảo cho khóa sau.'
    }
  },
  {
    id: 'bq-tight-deadline',
    companyHint: 'S*** (Execution Excellence)',
    competency: 'Prioritization under Pressure',
    question: 'Kể về một lần bạn có quá nhiều việc phải làm mà thời gian không đủ. Bạn đã ưu tiên như thế nào?',
    whatInterviewerSeeks: 'Tư duy ưu tiên theo giá trị/tác động, dám cắt giảm phạm vi (scope) hợp lý và chủ động giao tiếp sớm với các bên liên quan.',
    sampleStarAnswer: {
      situation: 'Tuần cuối kỳ, em vừa phải nộp đồ án backend, vừa ôn 2 môn thi, đồng thời team đồ án phát hiện API thanh toán bị lỗi.',
      task: 'Em cần đảm bảo đồ án chạy được luồng chính trong buổi demo mà không ảnh hưởng tới việc thi.',
      action: 'Em liệt kê toàn bộ công việc, chia theo ma trận Khẩn cấp/Quan trọng, đề xuất với nhóm cắt tính năng xuất báo cáo PDF sang phiên bản sau và tập trung sửa lỗi thanh toán, viết test cho luồng đặt hàng.',
      result: 'Buổi demo chạy ổn định 100% luồng chính, nhóm đạt điểm A, và em vẫn hoàn thành 2 môn thi với điểm trên 8.'
    }
  },
  {
    id: 'bq-customer-impact',
    companyHint: 'M*** (Customer Obsession)',
    competency: 'User / Customer Focus',
    question: 'Kể về một lần bạn cải thiện trải nghiệm người dùng dựa trên phản hồi thực tế.',
    whatInterviewerSeeks: 'Khả năng lắng nghe người dùng, dùng số liệu để xác định vấn đề, và đo lường kết quả sau khi cải tiến.',
    sampleStarAnswer: {
      situation: 'Ứng dụng quản lý thư viện của CLB em làm có nhiều phản hồi rằng trang tìm sách rất chậm.',
      task: 'Em được giao tìm nguyên nhân và cải thiện tốc độ tìm kiếm.',
      action: 'Em bật log SQL và chạy EXPLAIN, phát hiện truy vấn LIKE quét toàn bảng và lỗi N+1 khi tải tác giả. Em thêm index phù hợp, dùng JOIN FETCH và phân trang kết quả.',
      result: 'Thời gian phản hồi giảm từ 3.2 giây xuống 180ms, số phản hồi tiêu cực về tốc độ giảm gần như bằng 0 trong tháng tiếp theo.'
    }
  }
];

/** Keyword cues for each STAR component (Vietnamese + English). */
export const STAR_CUES: Record<'situation' | 'task' | 'action' | 'result', string[]> = {
  situation: ['khi', 'trong dự án', 'đồ án', 'lúc đó', 'bối cảnh', 'thời điểm', 'tình huống', 'situation', 'during', 'at the time'],
  task: ['nhiệm vụ', 'mục tiêu', 'cần phải', 'được giao', 'trách nhiệm', 'yêu cầu', 'task', 'goal', 'responsible'],
  action: ['em đã', 'tôi đã', 'mình đã', 'em quyết định', 'em đề xuất', 'em viết', 'em phân tích', 'triển khai', 'action', 'i implemented', 'i decided'],
  result: ['kết quả', 'giảm', 'tăng', 'cải thiện', 'hoàn thành', 'đạt', 'bài học', 'result', 'improved', 'reduced', '%']
};

export interface StarEvaluation {
  score: number;
  detected: Record<'situation' | 'task' | 'action' | 'result', boolean>;
  hasMetrics: boolean;
  wordCount: number;
  feedback: string[];
}

/**
 * Heuristic STAR evaluator: detects S/T/A/R cues, quantified metrics and length.
 * Scoring: 20 points per STAR component (max 80) + 12 for metrics + 8 for adequate length.
 */
export function evaluateStarAnswer(answer: string): StarEvaluation {
  const text = (answer || '').toLowerCase();
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const detected = {
    situation: STAR_CUES.situation.some((c) => text.includes(c)),
    task: STAR_CUES.task.some((c) => text.includes(c)),
    action: STAR_CUES.action.some((c) => text.includes(c)),
    result: STAR_CUES.result.some((c) => text.includes(c))
  };

  const hasMetrics = /\d+\s*(%|ms|giây|phút|giờ|ngày|tuần|người|lần|x\b|điểm)/.test(text);

  let score = 0;
  (Object.keys(detected) as Array<keyof typeof detected>).forEach((k) => {
    if (detected[k]) score += 20;
  });
  if (hasMetrics) score += 12;
  if (wordCount >= 60) score += 8;
  if (wordCount === 0) score = 0;
  score = Math.min(100, score);

  const feedback: string[] = [];
  if (!detected.situation) feedback.push('Thiếu bối cảnh (Situation): Hãy mở đầu bằng "Khi em làm dự án X..." để người nghe hình dung tình huống.');
  if (!detected.task) feedback.push('Thiếu nhiệm vụ (Task): Nói rõ trách nhiệm/mục tiêu của RIÊNG BẠN trong tình huống đó.');
  if (!detected.action) feedback.push('Thiếu hành động (Action): Dùng ngôi "Em đã..." thay vì "Chúng em đã..." để làm nổi bật đóng góp cá nhân.');
  if (!detected.result) feedback.push('Thiếu kết quả (Result): Kết thúc bằng kết quả cụ thể và bài học rút ra.');
  if (!hasMetrics) feedback.push('Chưa có số liệu định lượng: Thêm con số (giảm 3s xuống 180ms, tăng 40%, 50 người dùng...) để câu chuyện thuyết phục hơn.');
  if (wordCount > 0 && wordCount < 60) feedback.push('Câu trả lời hơi ngắn: Một câu chuyện STAR tốt thường kéo dài 1.5 - 2 phút nói (khoảng 120 - 250 từ).');
  if (feedback.length === 0) feedback.push('Xuất sắc! Câu chuyện có đủ 4 thành phần STAR và số liệu định lượng thuyết phục.');

  return { score, detected, hasMetrics, wordCount, feedback };
}

export interface RapidFireStatement {
  id: string;
  topic: 'Java Backend' | 'Spring Boot' | 'Database' | 'Network';
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export const RAPID_FIRE_STATEMENTS: RapidFireStatement[] = [
  { id: 'rf-1', topic: 'Java Backend', statement: 'String trong Java là immutable.', isTrue: true, explanation: 'Đúng. Mọi thao tác "sửa" String đều tạo object mới; điều này giúp String an toàn đa luồng và dùng được làm key của HashMap.' },
  { id: 'rf-2', topic: 'Java Backend', statement: 'HashMap cho phép nhiều key null.', isTrue: false, explanation: 'Sai. HashMap chỉ cho phép đúng 1 key null (lưu ở bucket 0) và nhiều value null. ConcurrentHashMap thì cấm hoàn toàn null.' },
  { id: 'rf-3', topic: 'Java Backend', statement: 'Khối finally luôn chạy kể cả khi trong try có lệnh return.', isTrue: true, explanation: 'Đúng (trừ khi gọi System.exit() hoặc JVM crash). Không nên return trong finally vì nó sẽ nuốt mất exception.' },
  { id: 'rf-4', topic: 'Java Backend', statement: 'Integer a = 127, b = 127 thì a == b trả về true.', isTrue: true, explanation: 'Đúng. Integer Cache lưu sẵn giá trị từ -128 đến 127. Với 128 thì a == b trả về false; luôn dùng equals().' },
  { id: 'rf-5', topic: 'Java Backend', statement: 'volatile đảm bảo phép count++ là thread-safe.', isTrue: false, explanation: 'Sai. volatile chỉ đảm bảo visibility và chống reorder; count++ gồm 3 bước read-modify-write nên vẫn bị race condition. Dùng AtomicInteger.' },
  { id: 'rf-6', topic: 'Spring Boot', statement: 'Spring Bean mặc định có scope là singleton.', isTrue: true, explanation: 'Đúng. Mỗi ApplicationContext chỉ có 1 instance, nên tuyệt đối không lưu state theo request vào field của Bean.' },
  { id: 'rf-7', topic: 'Spring Boot', statement: '@Transactional mặc định rollback với cả checked exception.', isTrue: false, explanation: 'Sai. Mặc định chỉ rollback với RuntimeException và Error. Muốn rollback checked exception phải khai báo rollbackFor = Exception.class.' },
  { id: 'rf-8', topic: 'Spring Boot', statement: '@Transactional trên method private vẫn hoạt động bình thường.', isTrue: false, explanation: 'Sai. Spring AOP Proxy không thể intercept method private; annotation sẽ bị bỏ qua một cách im lặng.' },
  { id: 'rf-9', topic: 'Spring Boot', statement: 'Constructor Injection được khuyến nghị hơn Field Injection (@Autowired trên field).', isTrue: true, explanation: 'Đúng. Constructor Injection cho phép field final, dễ viết unit test, và phát hiện sớm vòng phụ thuộc (circular dependency).' },
  { id: 'rf-10', topic: 'Database', statement: 'Đánh index càng nhiều cột thì hệ thống càng nhanh.', isTrue: false, explanation: 'Sai. Mỗi index làm chậm INSERT/UPDATE/DELETE và tốn bộ nhớ. Chỉ index các cột thường xuyên lọc/sắp xếp với độ chọn lọc cao.' },
  { id: 'rf-11', topic: 'Database', statement: 'WHERE YEAR(created_at) = 2024 vẫn tận dụng được index trên created_at.', isTrue: false, explanation: 'Sai. Bọc hàm quanh cột làm mất khả năng dùng B-Tree index. Viết lại: created_at >= \'2024-01-01\' AND created_at < \'2025-01-01\'.' },
  { id: 'rf-12', topic: 'Database', statement: 'LIMIT 20 OFFSET 1000000 vẫn rất nhanh vì chỉ trả về 20 dòng.', isTrue: false, explanation: 'Sai. DB vẫn phải quét và bỏ qua 1 triệu dòng. Dùng Keyset/Cursor Pagination: WHERE id > :lastId ORDER BY id LIMIT 20.' },
  { id: 'rf-13', topic: 'Database', statement: 'PostgreSQL mặc định dùng mức cô lập Read Committed.', isTrue: true, explanation: 'Đúng. PostgreSQL mặc định là Read Committed, còn MySQL InnoDB mặc định là Repeatable Read.' },
  { id: 'rf-14', topic: 'Network', statement: 'HTTP PUT là idempotent còn POST thì không.', isTrue: true, explanation: 'Đúng. Gọi PUT nhiều lần cho cùng kết quả; POST mỗi lần có thể tạo bản ghi mới, cần Idempotency-Key để chống trùng lặp.' },
  { id: 'rf-15', topic: 'Network', statement: 'HTTP 401 nghĩa là đã đăng nhập nhưng không đủ quyền.', isTrue: false, explanation: 'Sai. 401 Unauthorized = chưa xác thực (thiếu/sai token). 403 Forbidden = đã xác thực nhưng không đủ quyền.' },
  { id: 'rf-16', topic: 'Network', statement: 'Payload của JWT được mã hóa nên không ai đọc được.', isTrue: false, explanation: 'Sai. Payload chỉ được Base64URL encode, ai cũng giải mã được. Chữ ký chỉ đảm bảo tính toàn vẹn, không đảm bảo bí mật.' },
  { id: 'rf-17', topic: 'Network', statement: 'CORS là cơ chế bảo vệ được thực thi bởi trình duyệt, không phải server.', isTrue: true, explanation: 'Đúng. Server chỉ trả header Access-Control-Allow-*, trình duyệt quyết định chặn hay cho JavaScript đọc response. curl/Postman không bị CORS.' },
  { id: 'rf-18', topic: 'Network', statement: 'UDP đảm bảo các gói tin đến đúng thứ tự.', isTrue: false, explanation: 'Sai. UDP không đảm bảo thứ tự lẫn việc gói tin có đến hay không; TCP mới có sequence number và cơ chế retransmission.' }
];

/** Picks `count` random rapid-fire statements (non-mutating). */
export function pickRapidFireRound(count: number, random: () => number = Math.random): RapidFireStatement[] {
  const pool = [...RAPID_FIRE_STATEMENTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}

export interface PracticeHistoryEntry {
  timestamp: number;
  companyMaskedName: string;
  level: 'Intern' | 'Fresher' | 'Junior';
  avgScore: number;
  decision: string;
  questionCount: number;
}

export const PRACTICE_HISTORY_STORAGE_KEY = 'mock_interview_history_v1';
export const PRACTICE_HISTORY_MAX_ENTRIES = 20;

/** Returns a new history array with the entry appended and capped to the max size. */
export function appendPracticeHistory(
  history: PracticeHistoryEntry[],
  entry: PracticeHistoryEntry,
  maxEntries: number = PRACTICE_HISTORY_MAX_ENTRIES
): PracticeHistoryEntry[] {
  const next = [...(Array.isArray(history) ? history : []), entry];
  return next.length > maxEntries ? next.slice(next.length - maxEntries) : next;
}

/** Summarizes practice history: total sessions, best score, and trend between last two sessions. */
export function summarizePracticeHistory(history: PracticeHistoryEntry[]): {
  totalSessions: number;
  bestScore: number;
  averageScore: number;
  trend: number;
} {
  if (!Array.isArray(history) || history.length === 0) {
    return { totalSessions: 0, bestScore: 0, averageScore: 0, trend: 0 };
  }
  const scores = history.map((h) => h.avgScore);
  const total = scores.reduce((a, b) => a + b, 0);
  const trend = history.length >= 2 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;
  return {
    totalSessions: history.length,
    bestScore: Math.max(...scores),
    averageScore: Math.round(total / history.length),
    trend
  };
}
