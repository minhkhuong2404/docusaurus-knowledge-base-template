export interface CoreKeyPoint {
  id: string;
  pointText: string;
  keywords: string[];
  weight: number; // Tỷ trọng điểm (10 - 40)
}

export interface MockInterviewQuestion {
  id: string;
  topic: 'Java Backend' | 'Spring Boot' | 'Database' | 'Network';
  level: 'Intern' | 'Fresher' | 'Junior';
  question: string;
  contextPrompt: string;
  coreKeyPoints: CoreKeyPoint[];
  idealAnswer: string;
  trapWarning: string;
  scoringCriteria: string;
}

export const MOCK_INTERVIEW_QUESTIONS: MockInterviewQuestion[] = [
  // ==========================================
  // CHỦ ĐỀ 1: JAVA BACKEND (10 CÂU)
  // ==========================================
  {
    id: 'java-pass-by-value',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Java là ngôn ngữ Pass-by-Value hay Pass-by-Reference? Hãy giải thích rõ cơ chế khi truyền một Object vào method.',
    contextPrompt: 'Phỏng vấn viên muốn kiểm tra hiểu biết của bạn về mô hình bộ nhớ Stack/Heap và bản chất truyền tham số trong Java.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Khẳng định Java luôn luôn là Pass-by-Value (truyền tham trị) 100% trong mọi trường hợp.',
        keywords: ['pass by value', 'pass-by-value', 'tham trị', 'luôn luôn', 'truyền tham trị'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Giải thích với Object: Java copy giá trị của địa chỉ tham chiếu (reference pointer) chứ không truyền bản thân biến tham chiếu gốc.',
        keywords: ['địa chỉ', 'tham chiếu', 'reference', 'copy', 'bản sao', 'con trỏ', 'pointer'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Nêu hệ quả: Có thể thay đổi thuộc tính bên trong object, nhưng nếu gán biến sang new Object() mới thì biến gốc bên ngoài không bị đổi.',
        keywords: ['thay đổi thuộc tính', 'gán mới', 'new object', 'không thay đổi', 'biến gốc', 'set'],
        weight: 30
      }
    ],
    idealAnswer: 'Java LUÔN LUÔN là Pass-by-Value (truyền tham trị) 100% trong mọi tình huống. Khi truyền kiểu nguyên thủy (int, boolean), Java copy giá trị thực tế. Khi truyền một Object, Java copy "giá trị của địa chỉ tham chiếu" (reference address) trỏ tới object trên Heap. Do đó, ta có thể dùng địa chỉ copy này để sửa đổi các thuộc tính bên trong object; nhưng nếu ta gán tham số đó bằng một object mới (param = new Object()), hành động đó chỉ làm trỏ biến copy sang ô nhớ khác, biến ban đầu của người gọi bên ngoài hoàn toàn không bị ảnh hưởng.',
    trapWarning: 'Phỏng vấn viên có thể đưa ra ví dụ hàm swap(User a, User b) và hỏi hàm này có đổi được 2 user bên ngoài không ➔ Trả lời dứt khoát: KHÔNG bao giờ đổi được!',
    scoringCriteria: 'Đạt tối đa nếu khẳng định Java luôn là Pass-by-Value và phân tích rõ việc copy địa chỉ tham chiếu.'
  },
  {
    id: 'java-hashmap-internals',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'HashMap trong Java hoạt động như thế nào dưới nắp ca-pô? Cơ chế xử lý xung đột băm (Hash Collision) từ Java 8+ diễn ra ra sao?',
    contextPrompt: 'Phỏng vấn viên muốn thấy bạn hiểu về mảng Bucket, hàm băm hashCode, Chaining và cấu trúc Cây Đỏ-Đen (Red-Black Tree).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'HashMap tổ chức dữ liệu dạng mảng các Node/Bucket, tính vị trí bucket dựa trên hàm băm hashCode() của Key.',
        keywords: ['mảng', 'bucket', 'hashcode', 'băm', 'chỉ số', 'vị trí', 'index'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Khi xảy ra Hash Collision (trùng bucket), Java dùng kỹ thuật Chaining liên kết các node thành LinkedList.',
        keywords: ['collision', 'xung đột', 'chaining', 'linkedlist', 'danh sách liên kết', 'trùng'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Từ Java 8+, khi số phần tử trong 1 bucket đạt từ 8 trở lên (và mảng >= 64), LinkedList chuyển hóa thành Red-Black Tree để giảm độ phức tạp từ O(N) xuống O(log N).',
        keywords: ['8', 'cây đỏ đen', 'red-black tree', 'tree', 'o(log n)', 'java 8', 'cây'],
        weight: 35
      }
    ],
    idealAnswer: 'HashMap tổ chức dữ liệu dưới dạng mảng các bucket. Khi gọi put(key, value), Java tính hash của key (kết hợp dịch bit xor) rồi lấy modulo kích thước mảng để xác định chỉ số bucket. Khi xảy ra xung đột băm (nhiều key rơi vào cùng 1 bucket), HashMap dùng cơ chế Chaining nối các phần tử thành một LinkedList. Từ Java 8+, nếu một bucket có từ 8 phần tử trở lên và tổng dung lượng mảng >= 64, danh sách liên kết sẽ tự động chuyển thành Cây Đỏ-Đen (Red-Black Tree) giúp độ phức tạp tìm kiếm giảm từ O(N) xuống O(log N). Khi số phần tử trong cây giảm xuống dưới 6, nó sẽ hạ cấp về LinkedList.',
    trapWarning: 'Câu hỏi xoáy: "Độ phức tạp get/put của HashMap trong trường hợp xấu nhất (Worst Case) là bao nhiêu?" ➔ Trả lời: Trong Java 7 là O(N), nhưng từ Java 8 trở đi là O(log N) nhờ Cây Đỏ-Đen.',
    scoringCriteria: 'Cần nêu được mảng bucket, cơ chế Chaining và mốc 8 phần tử chuyển thành Red-Black Tree trong Java 8.'
  },
  {
    id: 'java-equals-hashcode',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Tại sao khi override method equals() thì BẮT BUỘC phải override method hashCode()? Nếu không làm điều này thì hậu quả là gì?',
    contextPrompt: 'Kiểm tra hiểu biết về Hợp đồng equals() / hashCode() (The equals and hashCode Contract) khi dùng Collection dạng Map và Set.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Quy tắc hợp đồng: Nếu hai object equals() với nhau là true thì giá trị hashCode() của chúng BẮT BUỘC phải bằng nhau.',
        keywords: ['hợp đồng', 'contract', 'bằng nhau', 'true', 'giống nhau', 'cùng hashcode'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'Nếu không override hashCode(), hai object có nội dung giống nhau sẽ sinh ra 2 mã băm khác nhau dựa trên địa chỉ ô nhớ mặc định của Object gốc.',
        keywords: ['địa chỉ', 'mặc định', 'khác nhau', 'ô nhớ', 'default'],
        weight: 30
      },
      {
        id: 'p3',
        pointText: 'Hậu quả thực tế: Khi đưa vào HashMap hoặc HashSet, map.get() sẽ trả về null hoặc HashSet bị lưu trùng lặp dữ liệu.',
        keywords: ['hashmap', 'hashset', 'null', 'trùng lặp', 'không tìm thấy', 'duplicate', 'bucket'],
        weight: 30
      }
    ],
    idealAnswer: 'Theo hợp đồng của Java: Nếu hai đối tượng equals() bằng true, thì hashCode() của chúng BẮT BUỘC phải sinh ra cùng một giá trị số nguyên. Mặc định class Object sinh hashCode dựa trên địa chỉ vùng nhớ. Nếu chỉ override equals() mà quên override hashCode(), hai object có nội dung giống hệt nhau sẽ có hai mã hash khác nhau. Khi lưu vào HashMap hoặc HashSet, chúng sẽ rơi vào hai bucket hoàn toàn khác nhau. Khi gọi map.get(key), hệ thống tìm sai bucket và trả về null, hoặc HashSet cho phép lưu 2 phần tử trùng lặp, phá vỡ tính đúng đắn của dữ liệu.',
    trapWarning: 'Nếu phỏng vấn viên hỏi ngược lại: "Nếu 2 object có cùng hashCode thì equals() có bắt buộc phải true không?" ➔ Trả lời: KHÔNG, đó là hiện tượng Hash Collision thông thường!',
    scoringCriteria: 'Phải giải thích được hợp đồng equals/hashCode và hậu quả cụ thể khi thao tác với HashMap/HashSet.'
  },
  {
    id: 'java-string-immutable',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Tại sao String trong Java lại được thiết kế là bất biến (Immutable)? Bộ nhớ đệm String Constant Pool hoạt động như thế nào?',
    contextPrompt: 'Kiểm tra tư duy quản lý bộ nhớ, bảo mật chuỗi ký tự và cơ chế tái sử dụng ô nhớ String Pool.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'String là Immutable vì 3 nguyên nhân cốt lõi: Tiết kiệm bộ nhớ (String Pool), An toàn đa luồng (Thread-safe tự nhiên), và Bảo mật hệ thống.',
        keywords: ['tiết kiệm bộ nhớ', 'an toàn đa luồng', 'thread-safe', 'bảo mật', 'security', 'caching'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'String Pool là vùng nhớ đặc biệt trong Heap lưu trữ các chuỗi ký tự cố định để tái sử dụng, tránh tạo đối tượng trùng lặp.',
        keywords: ['string pool', 'constant pool', 'heap', 'tái sử dụng', 'literal'],
        weight: 30
      },
      {
        id: 'p3',
        pointText: 'Phân biệt: Khai báo String literal (String s = "abc") sẽ lưu trong Pool, còn new String("abc") luôn tạo object mới trên Heap.',
        keywords: ['literal', 'new string', 'toán tử new', 'ô nhớ mới'],
        weight: 30
      }
    ],
    idealAnswer: 'String trong Java là immutable vì 3 lý do: 1. Tiết kiệm bộ nhớ: Cho phép String Pool hoạt động; nếu một chuỗi được hàng ngàn nơi sử dụng, chúng chỉ trỏ vào 1 địa chỉ duy nhất; 2. An toàn đa luồng (Thread-safe): Vì giá trị không thể thay đổi sau khi tạo nên nhiều thread đọc cùng lúc không bao giờ sợ race condition; 3. Bảo mật: Các thông tin nhạy cảm như URL kết nối DB, username/password được truyền qua mạng nếu bị sửa ngầm sẽ gây lỗ hổng bảo mật. Khai báo String s = "abc" sẽ tìm và tái sử dụng chuỗi trong Pool, còn dùng new String("abc") sẽ luôn ép cấp phát object mới trên Heap.',
    trapWarning: 'Chú ý: Từ Java 7, String Constant Pool đã được chuyển từ Metaspace/PermGen về vùng nhớ Heap thông thường để tránh lỗi java.lang.OutOfMemoryError: PermGen space.',
    scoringCriteria: 'Nêu đủ 3 yếu tố: Bộ nhớ/String Pool, Thread-safety và Security, cùng sự khác biệt giữa literal và new.'
  },
  {
    id: 'java-arraylist-vs-linkedlist',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Phân biệt sự khác nhau giữa ArrayList và LinkedList? Tại sao trong thực tế đi làm 99% kỹ sư chọn dùng ArrayList?',
    contextPrompt: 'Kiểm tra kiến thức cấu trúc dữ liệu nền tảng và hiểu biết về CPU Cache Locality.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'ArrayList dựa trên mảng động liên tục (Contiguous Array), truy cập theo chỉ số đạt O(1). LinkedList dựa trên các Node con trỏ phân tán, truy cập tốn O(N).',
        keywords: ['mảng liên tục', 'con trỏ', 'o(1)', 'o(n)', 'node', 'truy cập ngẫu nhiên', 'random access'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Vấn đề bộ nhớ đệm: ArrayList tận dụng tối đa CPU Cache Locality (nạp cả Cache Line). LinkedList phân tán khắp Heap gây liên tục Cache Miss.',
        keywords: ['cpu cache', 'cache locality', 'cache miss', 'bộ nhớ đệm', 'liên tục'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Giải thích tại sao không dùng LinkedList: Mỗi Node của LinkedList tốn thêm bộ nhớ lưu con trỏ prev/next, và thao tác chèn giữa vẫn tốn O(N) để tìm vị trí.',
        keywords: ['tốn bộ nhớ', 'overhead', 'con trỏ prev next', '99%', 'thực tế'],
        weight: 30
      }
    ],
    idealAnswer: 'ArrayList lưu trữ dữ liệu trên một mảng liên tục (Contiguous Array), cho phép truy cập ngẫu nhiên phần tử O(1) theo index. LinkedList lưu trên các Node con trỏ kép rải rác trên Heap, muốn lấy phần tử thứ K phải duyệt tuần tự tốn O(K). Lý do 99% thực tế dùng ArrayList là vì CPU Cache Locality: Khi đọc 1 phần tử của ArrayList, CPU nạp luôn cả đường đệm (Cache Line 64 bytes) chứa các phần tử kế tiếp vào CPU L1/L2 Cache giúp tốc độ cực nhanh. LinkedList bị rải rác khắp Heap làm CPU liên tục dính Cache Miss. Ngoài ra mỗi Node LinkedList tốn thêm bộ nhớ lưu con trỏ prev và next, và để chèn ở giữa vẫn mất O(N) tìm kiếm.',
    trapWarning: 'Đừng mắc bẫy sách giáo khoa cũ: "LinkedList chèn ở giữa nhanh hơn ArrayList". Thực tế để chèn vào vị trí K, LinkedList vẫn mất O(K) để duyệt đến vị trí đó!',
    scoringCriteria: 'Đạt điểm tối đa khi phân tích được CPU Cache Locality của ArrayList và chi phí con trỏ của LinkedList.'
  },
  {
    id: 'java-checked-unchecked-exceptions',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'Phân biệt Checked Exception và Unchecked Exception trong Java? Khi nào nên sử dụng mỗi loại?',
    contextPrompt: 'Kiểm tra kiến thức cây phả hệ Throwable, triết lý thiết kế xử lý lỗi trong kiến trúc phần mềm.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Checked Exception kế thừa từ Exception (trừ RuntimeException), compiler bắt buộc phải try-catch hoặc khai báo throws.',
        keywords: ['checked', 'compiler', 'bắt buộc', 'try-catch', 'throws', 'biên dịch'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Unchecked Exception kế thừa từ RuntimeException, xảy ra lúc chạy do lỗi lập trình (NPE, IllegalArgumentException) và compiler không ép bắt.',
        keywords: ['unchecked', 'runtimeexception', 'runtime', 'lập trình viên', 'không ép buộc', 'npe'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Xu hướng kiến trúc hiện đại (như Spring): Ưu tiên dùng Unchecked Exception cho lỗi nghiệp vụ để code sạch sẽ, không làm ô nhiễm chữ ký hàm.',
        keywords: ['nghiệp vụ', 'business exception', 'spring', 'sạch code', 'chữ ký hàm'],
        weight: 30
      }
    ],
    idealAnswer: 'Checked Exception là các exception kế thừa từ java.lang.Exception (loại trừ RuntimeException). Trình biên dịch bắt buộc lập trình viên phải xử lý bằng try-catch hoặc ném ra ngoài bằng throws (ví dụ IOException, SQLException) – dùng cho các lỗi ngoại cảnh hệ thống có khả năng phục hồi. Unchecked Exception kế thừa từ RuntimeException, xảy ra trong quá trình chạy chương trình, thường do lỗi logic của lập trình viên (NullPointerException, ArrayIndexOutOfBoundsException) và compiler không bắt buộc khai báo. Trong các framework hiện đại như Spring, người ta ưu tiên dùng Unchecked Exception cho các lỗi nghiệp vụ để giữ chữ ký hàm sạch sẽ và gom về xử lý ở ControllerAdvice.',
    trapWarning: 'Phỏng vấn viên sẽ hỏi thêm: "Error khác Exception thế nào?" ➔ Error (như OutOfMemoryError, StackOverflowError) là sự cố nghiêm trọng ở cấp JVM mà ứng dụng không nên và không thể phục hồi.',
    scoringCriteria: 'Phân biệt chính xác nguồn gốc kế thừa, thời điểm kiểm tra (compile-time vs runtime) và ứng dụng thực tế.'
  },
  {
    id: 'java-comparable-comparator',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'Phân biệt Comparable và Comparator trong Java? Khi nào dùng cái nào?',
    contextPrompt: 'Kiểm tra hiểu biết về sắp xếp đối tượng, nguyên lý Open/Closed Principle trong thiết kế hướng đối tượng.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Comparable định nghĩa thứ tự sắp xếp tự nhiên (Natural Ordering) mặc định bên trong class thông qua method compareTo(T o).',
        keywords: ['comparable', 'thứ tự tự nhiên', 'natural order', 'compareto', 'bên trong class'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'Comparator định nghĩa chiến lược sắp xếp tùy chỉnh bên ngoài class thông qua method compare(T o1, T o2), cho phép có nhiều tiêu chí sắp xếp.',
        keywords: ['comparator', 'tùy chỉnh', 'custom order', 'compare', 'bên ngoài', 'nhiều tiêu chí'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Từ Java 8, Comparator hỗ trợ cú pháp Lambda và method chaining mạnh mẽ (Comparator.comparing(...).thenComparing(...)).',
        keywords: ['lambda', 'java 8', 'chaining', 'comparing', 'reversed'],
        weight: 20
      }
    ],
    idealAnswer: 'Comparable nằm trong package java.lang, dùng để định nghĩa thứ tự sắp xếp tự nhiên (Natural Order) mặc định của chính đối tượng đó bằng cách implements Comparable<T> và override method compareTo(T o). Comparator nằm trong java.util, dùng để định nghĩa chiến lược sắp xếp tùy chỉnh từ bên ngoài thông qua method compare(T o1, T o2). Dùng Comparable khi class có một thứ tự mặc định duy nhất (ví dụ số, ngày tháng). Dùng Comparator khi muốn có nhiều tiêu chí sắp xếp khác nhau (sắp xếp theo tên, theo tuổi, theo giá giảm dần) mà không cần can thiệp sửa đổi mã nguồn của class gốc, tuân thủ nguyên lý Open/Closed của SOLID.',
    trapWarning: 'Khi viết method compare(a, b), cấm dùng phép trừ return a.getAge() - b.getAge() vì nguy cơ tràn số nguyên (Integer Overflow) nếu gặp số âm lớn! Luôn dùng Integer.compare(a, b).',
    scoringCriteria: 'Nêu rõ vị trí package, method đại diện (compareTo vs compare) và ngữ cảnh sử dụng.'
  },
  {
    id: 'java-memory-stack-heap',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Bộ nhớ Stack và Heap trong JVM khác nhau như thế nào? Biến nguyên thủy và Object được phân bổ ở đâu?',
    contextPrompt: 'Kiểm tra hiểu biết nền tảng về JVM Memory Model, Garbage Collection và vòng đời biến.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Stack: Mỗi Thread có Stack riêng, lưu biến cục bộ nguyên thủy và con trỏ tham chiếu; tự giải phóng ngay khi hàm kết thúc.',
        keywords: ['stack', 'thread riêng', 'biến cục bộ', 'tham chiếu', 'giải phóng ngay', 'nhanh'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'Heap: Vùng nhớ dùng chung cho toàn bộ ứng dụng, nơi cấp phát tất cả các đối tượng (Object), được quản lý bởi Garbage Collector (GC).',
        keywords: ['heap', 'dùng chung', 'object', 'đối tượng', 'gc', 'garbage collector'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Lỗi bộ nhớ: Stack tràn gây ra StackOverflowError (thường do đệ quy vô tận), Heap đầy gây ra OutOfMemoryError: Java heap space.',
        keywords: ['stackoverflowerror', 'outofmemoryerror', 'đệ quy', 'oom', 'tràn'],
        weight: 20
      }
    ],
    idealAnswer: 'Stack là vùng nhớ riêng biệt của từng luồng (Thread-safe tự nhiên). Nó lưu trữ các biến cục bộ kiểu nguyên thủy và các con trỏ địa chỉ tham chiếu. Khi phương thức thực thi xong, khung ngăn xếp (Stack Frame) tự động giải phóng ngay lập tức nên tốc độ cực nhanh. Heap là vùng nhớ dùng chung cho toàn bộ ứng dụng, nơi cấp phát tất cả các Object, mảng và dữ liệu thực tế. Vùng nhớ này do bộ thu gom rác (Garbage Collector) quản lý dọn dẹp. Nếu đệ quy không có điểm dừng dẫn đến cạn kiệt Stack sẽ ném StackOverflowError; nếu tạo quá nhiều object sống sót trên Heap mà GC không dọn kịp sẽ ném OutOfMemoryError.',
    trapWarning: 'Lưu ý: Biến nguyên thủy nếu là thuộc tính (field) của một class thì nó nằm trên Heap cùng với instance của Object đó, chứ không nằm trên Stack!',
    scoringCriteria: 'Phân tích rõ Stack (per-thread, biến cục bộ) vs Heap (shared, object, GC), kèm hai lỗi tương ứng.'
  },
  {
    id: 'java-volatile-synchronized',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'Phân biệt từ khóa volatile và synchronized trong lập trình đa luồng Java? Khi nào dùng volatile là chưa đủ?',
    contextPrompt: 'Kiểm tra kiến thức Java Concurrency, Memory Visibility vs Atomicity, và Thread Synchronization.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'volatile đảm bảo tính nhìn thấy (Visibility) giữa các luồng bằng cách đọc/ghi trực tiếp từ RAM, không lưu cache CPU; volatile KHÔNG đảm bảo tính nguyên tử (Atomicity).',
        keywords: ['volatile', 'visibility', 'tính nhìn thấy', 'ram', 'không nguyên tử', 'atomicity'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'synchronized đảm bảo cả tính nhìn thấy lẫn tính nguyên tử bằng cách khóa màn hình độc quyền (Mutual Exclusion Lock), nhưng có chi phí chặn luồng (blocking).',
        keywords: ['synchronized', 'nguyên tử', 'khóa', 'lock', 'blocking', 'chặn luồng'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Ví dụ thất bại của volatile: Phép toán count++ gồm 3 bước bytecode (đọc - tăng - ghi), nhiều luồng chạy cùng lúc vẫn bị dính Race Condition làm sai kết quả.',
        keywords: ['count++', 'race condition', '3 bước', 'đọc ghi', 'sai kết quả'],
        weight: 25
      }
    ],
    idealAnswer: 'Từ khóa volatile đảm bảo tính nhìn thấy (Visibility) giữa các luồng: Khi một luồng cập nhật biến volatile, giá trị mới lập tức được đẩy xuống RAM chính và các luồng khác luôn đọc được giá trị mới nhất thay vì đọc giá trị cũ trong CPU Cache. Tuy nhiên, volatile KHÔNG đảm bảo tính nguyên tử (Atomicity). Với phép toán như count++, nó bao gồm 3 bước: đọc giá trị -> tăng 1 -> ghi lại; nếu 2 luồng cùng chạy count++ thì volatile vẫn bị mất mát dữ liệu do race condition. Khối lệnh synchronized đảm bảo cả tính nhìn thấy lẫn tính nguyên tử nhờ cơ chế khóa độc quyền (Lock), chỉ cho phép 1 luồng truy cập tại một thời điểm nhưng có chi phí chặn luồng.',
    trapWarning: 'volatile chỉ phù hợp khi biến được dùng làm cờ báo trạng thái (ví dụ: volatile boolean isRunning = true) mà thao tác ghi không phụ thuộc vào giá trị trước đó của nó.',
    scoringCriteria: 'Phải chỉ ra được sự khác biệt giữa Visibility và Atomicity, và lấy ví dụ count++ để chứng minh volatile không nguyên tử.'
  },
  {
    id: 'java-integer-cache-pool',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Tại sao trong Java: Integer a = 127, b = 127; biểu thức (a == b) là true, nhưng với Integer a = 128, b = 128; biểu thức (a == b) lại là false?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về toán tử ==, đối tượng Wrapper, và cơ chế Integer Cache (-128 đến 127).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Toán tử == so sánh địa chỉ ô nhớ (tham chiếu) của hai đối tượng trên Heap, không so sánh giá trị logic.',
        keywords: ['==', 'địa chỉ', 'ô nhớ', 'tham chiếu', 'reference'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Java có cơ chế bộ nhớ đệm IntegerCache lưu trữ sẵn các đối tượng số nguyên trong phạm vi từ -128 đến 127.',
        keywords: ['integercache', '-128 đến 127', 'cache', 'dải số', 'bộ nhớ đệm', '127'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Khi gán 127, Java tái sử dụng cùng 1 instance trong cache (a == b true). Khi gán 128, Java tạo 2 instance mới trên Heap (a == b false). Đi làm luôn dùng .equals().',
        keywords: ['tái sử dụng', 'instance mới', 'equals', 'objects.equals', 'heap khác nhau'],
        weight: 25
      }
    ],
    idealAnswer: 'Toán tử == trong Java so sánh địa chỉ tham chiếu ô nhớ của hai đối tượng trên Heap. Khi gán Integer a = 127, Java tự động thực hiện Autoboxing gọi Integer.valueOf(127). Java Language Specification quy định JVM duy trì một bộ nhớ đệm tĩnh IntegerCache trong khoảng từ -128 đến 127. Trong khoảng này, JVM tái sử dụng cùng một instance đối tượng đã tạo sẵn, nên a và b cùng trỏ tới 1 địa chỉ ô nhớ -> a == b là true. Ngoài dải này (như 128), JVM buộc phải cấp phát hai đối tượng Integer mới tinh nằm ở hai ô nhớ riêng biệt trên Heap -> a == b trả về false. Đi làm luôn phải dùng a.equals(b) hoặc Objects.equals(a, b).',
    trapWarning: 'Lỗi này cực kỳ nguy hiểm trên Production: Khi test local với ID nhỏ hơn 128 code chạy đúng, nhưng khi số lượng bản ghi DB vượt qua 128 thì logic so sánh ID bằng == bị sập hoàn toàn!',
    scoringCriteria: 'Nêu rõ toán tử == so sánh địa chỉ ô nhớ và dải cache cố định [-128, 127] của Integer.'
  },
  {
    id: 'java-concurrent-hashmap-evolution',
    topic: 'Java Backend',
    level: 'Junior',
    question: 'ConcurrentHashMap trong Java 7 và Java 8+ khác nhau như thế nào về cơ chế đồng thời? Tại sao Java 8 loại bỏ Segment Locking (ReentrantLock) và chuyển sang CAS + synchronized?',
    contextPrompt: 'Phỏng vấn viên muốn đánh giá hiểu biết sâu về kỹ thuật đồng thời cao (High Concurrency), Lock Striping và sự tiến hóa của Java Memory Model.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Java 7 sử dụng Segment Locking (Lock Striping chia bảng thành 16 Segment kế thừa ReentrantLock), tối đa 16 luồng ghi đồng thời.',
        keywords: ['segment', 'segment locking', 'lock striping', 'reentrantlock', '16', 'java 7'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Java 8+ chuyển sang khóa cấp độ Node (Bucket-level locking) kết hợp CAS (Compare-And-Swap) khi bucket rỗng và synchronized trên Node đầu tiên khi bucket có phần tử.',
        keywords: ['cas', 'compare-and-swap', 'synchronized', 'node', 'bucket', 'đầu tiên', 'java 8'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Lợi ích: Độ chi tiết khóa nhỏ hơn nhiều lần (Fine-grained locking), tiết kiệm bộ nhớ do bỏ bọc Segment, hỗ trợ cấu trúc Cây Đỏ-Đen và tăng thông lượng ghi theo số lượng bucket.',
        keywords: ['tiết kiệm bộ nhớ', 'fine-grained', 'thông lượng', 'cây đỏ đen', 'red-black tree'],
        weight: 30
      }
    ],
    idealAnswer: 'Trong Java 7, ConcurrentHashMap áp dụng mô hình Segment Locking (Lock Striping): bảng băm được phân nhỏ thành 16 Segment độc lập (mỗi Segment kế thừa ReentrantLock). Dù an toàn luồng, thông lượng ghi bị chặn ở mức tối đa 16 thread đồng thời và tốn nhiều bộ nhớ phụ trợ cho các Segment object. Sang Java 8+, cơ chế được tái cấu trúc hoàn toàn thành Khóa cấp độ Node (Bucket-level): 1. Khi một bucket còn rỗng (null), Java sử dụng toán tử phần cứng CAS (Compare-And-Swap) không khóa để gán node mới vào; 2. Khi bucket đã có phần tử, Java chỉ lock (synchronized) đúng trên đối tượng Node đầu tiên của bucket đó. Nhờ vậy, độ chi tiết khóa mịn hơn hàng chục lần (hàng ngàn luồng có thể ghi đồng thời nếu khác bucket), loại bỏ hoàn toàn bộ nhớ thừa của Segment và tích hợp mượt mà với chuyển đổi Cây Đỏ-Đen (Red-Black Tree).',
    trapWarning: 'Câu hỏi bẫy: "Tại sao Java 8 lại dùng synchronized thay vì ReentrantLock?" ➔ Trả lời: Từ Java 6+, JVM HotSpot đã tối ưu hóa synchronized vượt bậc với Biased Locking, Thin Locking (CAS spin), và Lock Coarsening/Elimination, giúp synchronized nhẹ hơn nhiều so với việc tạo vô số object ReentrantLock.',
    scoringCriteria: 'Phải phân tích rõ Segment Locking trong Java 7 vs cơ chế kết hợp CAS + synchronized trên Node đầu tiên của Java 8.'
  },
  {
    id: 'java-threadpool-executor-internals',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'ThreadPoolExecutor xử lý luồng công việc (Task Flow) như thế nào khi submit một Runnable? Khi nào task được đưa vào BlockingQueue, khi nào tạo thêm thread vượt corePoolSize và khi nào kích hoạt RejectedExecutionHandler?',
    contextPrompt: 'Kiểm tra xem ứng viên có hiểu bản chất vòng đời của luồng và cấu hình thread pool an toàn trong môi trường Production hay không.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Nếu số luồng đang chạy < corePoolSize: Luôn tạo ngay worker thread mới để thực thi task.',
        keywords: ['corepoolsize', 'nhỏ hơn', 'tạo thread mới', 'worker thread'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Nếu số luồng >= corePoolSize: Task BẮT BUỘC được đưa vào BlockingQueue xếp hàng chờ, CHƯA tạo thêm thread ngay.',
        keywords: ['blockingqueue', 'hàng đợi', 'xếp hàng', 'chưa tạo thread', 'queue'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Chỉ khi BlockingQueue ĐẦY: Mới tiếp tục tạo thêm thread cho tới maxPoolSize. Nếu vượt maxPoolSize và queue đầy -> Kích hoạt RejectedExecutionHandler.',
        keywords: ['queue đầy', 'hàng đợi đầy', 'maxpoolsize', 'reject', 'rejectedexecutionhandler', 'từ chối'],
        weight: 35
      }
    ],
    idealAnswer: 'Quy trình xử lý một task trong ThreadPoolExecutor diễn ra theo 4 bước tuần tự: 1. Nếu số thread hiện tại nhỏ hơn corePoolSize, pool luôn tạo mới một Worker thread để chạy task ngay lập tức; 2. Nếu số thread đã đạt corePoolSize, task mới sẽ được đưa vào hàng đợi BlockingQueue để xếp hàng chờ các worker rảnh tay lấy ra xử lý; 3. Nếu BlockingQueue bị ĐẦY (đối với Bounded Queue), pool mới bắt đầu tạo thêm các thread tạm thời vượt mức core cho tới khi chạm trần maximumPoolSize; 4. Nếu số thread đã chạm maximumPoolSize VÀ BlockingQueue vẫn đầy kín, pool sẽ kích hoạt chính sách từ chối RejectedExecutionHandler (như AbortPolicy ném exception, CallerRunsPolicy ép thread gọi tự chạy, hoặc DiscardPolicy bỏ qua).',
    trapWarning: 'Cực kỳ nhiều lập trình viên nhầm tưởng pool sẽ tạo thread tăng dần từ corePoolSize lên maximumPoolSize rồi mới đẩy vào queue! Thực tế: Phải đầy Queue thì mới tạo vượt corePoolSize. Nếu dùng LinkedBlockingQueue không giới hạn dung lượng, maximumPoolSize hoàn toàn vô dụng!',
    scoringCriteria: 'Phải chỉ ra đúng thứ tự: Core thread -> BlockingQueue -> Max thread -> Rejection Policy.'
  },
  {
    id: 'java-threadlocal-memory-leak',
    topic: 'Java Backend',
    level: 'Junior',
    question: 'ThreadLocal hoạt động như thế nào trong Java? Tại sao ThreadLocal lại tiềm ẩn nguy cơ rò rỉ bộ nhớ (Memory Leak) nghiêm trọng khi sử dụng chung với Thread Pool? Cách phòng tránh là gì?',
    contextPrompt: 'Phỏng vấn viên muốn kiểm tra kiến thức về WeakReference, cấu trúc ThreadLocalMap và quản lý vòng đời bộ nhớ trong ứng dụng Web/Microservice.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'ThreadLocalMap nằm bên trong mỗi Thread, lưu Entry với Key là WeakReference trỏ tới ThreadLocal và Value là StrongReference.',
        keywords: ['threadlocalmap', 'weakreference', 'tham chiếu yếu', 'strongreference', 'entry', 'key', 'value'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Nguyên nhân Memory Leak: Trong Thread Pool (như Tomcat worker), thread không bao giờ chết. Khi ThreadLocal object bị GC dọn mất (Key thành null), Value vẫn bị giữ chặt bởi Thread, không thể giải phóng.',
        keywords: ['thread pool', 'không chết', 'tái sử dụng', 'rò rỉ', 'memory leak', 'key null', 'value giữ lại'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Giải pháp chuẩn mực: BẮT BUỘC gọi threadLocal.remove() trong khối finally sau khi hoàn thành request.',
        keywords: ['remove()', 'finally', 'try finally', 'dọn dẹp', 'clean up'],
        weight: 30
      }
    ],
    idealAnswer: 'Mỗi Thread trong Java sở hữu một bảng băm nội tại là ThreadLocalMap. Các Entry trong Map này chứa Key là một WeakReference (tham chiếu yếu) trỏ tới đối tượng ThreadLocal, nhưng Value lại là một StrongReference (tham chiếu mạnh). Nguy cơ rò rỉ bộ nhớ xảy ra trong môi trường Thread Pool (ví dụ Tomcat worker threads hay Spring TaskExecutor): các thread này được tái sử dụng liên tục và KHÔNG BAO GIỜ CHẾT. Khi biến ThreadLocal ở phạm vi phương thức không còn ai tham chiếu, GC sẽ thu hồi Key (Key trở thành null), nhưng đối tượng Value vẫn được giữ chặt bởi con trỏ của Thread đang sống, khiến GC không thể giải phóng ô nhớ đó. Hậu quả là tích lũy dần gây OutOfMemoryError: Metaspace/Java heap space. Cách phòng tránh duy nhất đạt chuẩn: Luôn đặt lệnh threadLocal.remove() trong khối `finally` ngay sau khi xử lý xong nghiệp vụ.',
    trapWarning: 'Nếu quên remove(), ngoài rò rỉ bộ nhớ, request sau khi dùng lại worker thread đó sẽ "đọc trộm" được UserContext hoặc Tenant ID của khách hàng ở request trước đó (ô nhiễm dữ liệu bảo mật nghiêm trọng).',
    scoringCriteria: 'Phải giải thích được bản chất WeakReference của Key, vòng đời vô hạn của thread trong Thread Pool và bắt buộc dùng remove() trong finally.'
  },
  {
    id: 'java-garbage-collection-generations',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'Mô hình bộ nhớ Generational Garbage Collection (Young Gen, Old Gen, Metaspace) hoạt động như thế nào? Điều kiện và chu trình xúc tiến (Promotion) đối tượng từ Eden sang Survivor và Old Gen là gì?',
    contextPrompt: 'Đánh giá kiến thức phân bổ bộ nhớ JVM Heap, giả thuyết Weak Generational Hypothesis và tối ưu hóa thời gian dừng Stop-The-World (STW).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Heap chia thành Young Generation (gồm Eden, Survivor S0, Survivor S1) và Old Generation. Metaspace nằm ở Off-heap Native Memory.',
        keywords: ['eden', 'survivor', 'young generation', 'old generation', 'metaspace', 'heap'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Hầu hết object mới được cấp phát ở Eden. Khi Eden đầy, Minor GC kích hoạt dọn rác và di chuyển object sống sang không gian Survivor (S0/S1) luân phiên.',
        keywords: ['minor gc', 'cấp phát eden', 's0', 's1', 'copying', 'luân phiên'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Quy tắc Promotion lên Old Gen: Khi tuổi đối tượng (Tenuring Age trong Object Header) vượt ngưỡng MaxTenuringThreshold (mặc định 15) hoặc do Dynamic Tenuring (Survivor quá 50% dung lượng).',
        keywords: ['promotion', 'xúc tiến', 'tuổi', 'tenuring age', '15', 'old gen', 'maxtenuringthreshold'],
        weight: 35
      }
    ],
    idealAnswer: 'Bộ nhớ Heap của JVM dựa trên "Giả thuyết thế hệ yếu" (Weak Generational Hypothesis: hầu hết đối tượng chết trẻ ngay sau khi sinh ra). Heap được chia thành: 1. Young Generation: gồm không gian Eden (nơi đối tượng mới được new) và hai vùng đệm Survivor S0, S1 (tỷ lệ chuẩn 8:1:1); 2. Old Generation (Tenured): chứa các đối tượng có tuổi thọ cao (singleton bean, cache pool); 3. Metaspace: nằm ở bộ nhớ ngoài Native Memory thay thế PermGen từ Java 8 lưu trữ class metadata. Chu trình hoạt động: Khi Eden đầy, Minor GC kích hoạt, quét và copy các đối tượng còn sống sang S0, đồng thời tăng trường tuổi (Age, tối đa 4 bit = 15) trong Mark Word của Object Header. Ở các lần Minor GC tiếp theo, đối tượng luân chuyển giữa S0 và S1. Đối tượng sẽ được thăng cấp (Promoted) lên Old Gen khi: Tuổi vượt qua ngưỡng MaxTenuringThreshold (mặc định là 15) hoặc do cơ chế Dynamic Age Calculation (khi một nhóm tuổi chiếm quá 50% Survivor space). Khi Old Gen cạn kiệt, Major/Full GC sẽ diễn ra với thời gian Stop-The-World dài hơn nhiều.',
    trapWarning: 'Tại sao tuổi tối đa của đối tượng trong JVM chỉ là 15 mà không phải 16 hay 100? ➔ Trả lời: Do trường lưu age trong Mark Word của 64-bit JVM header chỉ dành đúng 4 bit (2^4 - 1 = 15).',
    scoringCriteria: 'Phải mô tả đúng phân vùng Eden/S0/S1, thuật toán Copying của Minor GC, và các điều kiện xúc tiến (MaxTenuringThreshold 15 & Dynamic Aging).'
  },
  {
    id: 'java-virtual-threads-loom',
    topic: 'Java Backend',
    level: 'Junior',
    question: 'Virtual Threads (Project Loom trong Java 21) khác gì so với Platform Threads truyền thống (1:1 OS Thread)? Hiện tượng Carrier Thread Pinning xảy ra khi nào và làm sao để khắc phục?',
    contextPrompt: 'Kiểm tra mức độ cập nhật công nghệ hiện đại Java 21 LTS, lập trình thông lượng cao (High Throughput) và xử lý cạm bẫy khi chuyển đổi kiến trúc.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Platform Thread ánh xạ 1:1 với OS Kernel Thread (nặng ~1MB stack, tốn context switch), còn Virtual Thread là M:N do JVM quản lý trên user-space (nhẹ chỉ vài KB, tạo hàng triệu thread).',
        keywords: ['1:1', 'm:n', 'os thread', 'kernel thread', 'user space', 'vài kb', 'triệu thread'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Cơ chế ngắt I/O: Khi gặp thao tác I/O blocking (JDBC, Socket, HTTP), Virtual Thread unmount khỏi Carrier Thread nhường CPU cho thread khác và mount lại khi có dữ liệu.',
        keywords: ['unmount', 'mount', 'carrier thread', 'blocking i/o', 'nhường cpu', 'forkjoinpool'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Carrier Thread Pinning: Xảy ra khi Virtual Thread bị khóa chặt vào carrier thread do thực thi trong khối synchronized hoặc gọi Native Method (JNI). Khắc phục: Thay synchronized bằng ReentrantLock.',
        keywords: ['pinning', 'carrier thread pinning', 'synchronized', 'native method', 'jni', 'reentrantlock'],
        weight: 30
      }
    ],
    idealAnswer: 'Trước Java 21, Platform Threads ánh xạ tỷ lệ 1:1 trực tiếp với Kernel Thread của hệ điều hành. Mỗi thread tốn khoảng 1MB bộ nhớ Stack và chi phí chuyển ngữ cảnh (Context Switching) đắt đỏ, khiến một server chỉ chịu tải được khoảng 5,000 - 10,000 luồng. Virtual Threads (Project Loom) áp dụng mô hình M:N, được quản lý hoàn toàn ở không gian người dùng (User-space) bởi JVM: hàng triệu Virtual Threads chạy luân phiên trên một nhóm nhỏ Worker Threads của ForkJoinPool gọi là "Carrier Threads". Khi Virtual Thread gặp thao tác chặn I/O (chờ database query hoặc gọi REST API), JVM tự động "unmount" nó khỏi Carrier Thread, cất call-stack lên Heap và nhường Carrier Thread đó cho Virtual Thread khác xử lý. Khi I/O có kết quả (qua epoll/kqueue), nó được "mount" lại tiếp tục chạy. Cạm bẫy Pinning: Nếu code đang ở trong khối `synchronized` hoặc gọi hàm C/C++ (JNI), Virtual Thread không thể unmount và bị "ghim chết" (pinned) vào Carrier Thread, làm tê liệt thread pool của OS. Cách khắc phục: Thay thế toàn bộ `synchronized` bằng `ReentrantLock`.',
    trapWarning: 'Không bao giờ được "Pool" Virtual Threads (tức không dùng ThreadPoolExecutor để tái sử dụng Virtual Thread)! Vì Virtual Thread sinh ra siêu nhẹ và dùng xong là vứt bỏ, chỉ cần gọi Executors.newVirtualThreadPerTaskExecutor().',
    scoringCriteria: 'Phân tích được mô hình M:N user-space, cơ chế mount/unmount khi gặp blocking I/O, và hiện tượng Carrier Thread Pinning cùng giải pháp ReentrantLock.'
  },
  {
    id: 'java-jit-tiered-compilation',
    topic: 'Java Backend',
    level: 'Junior',
    question: 'Cơ chế Tiered Compilation trong JVM HotSpot hoạt động như thế nào? Quá trình một đoạn mã bytecode chuyển từ Interpreter sang C1 (Client Compiler) và C2 (Server Compiler) diễn ra khi nào?',
    contextPrompt: 'Kiểm tra kiến thức cốt lõi về máy ảo JVM HotSpot, cơ chế tối ưu hóa thời gian chạy và quá trình JIT Compiler tăng tốc ứng dụng Java.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Mặc định HotSpot chạy kết hợp Interpreter (khởi động tức thì) và JIT Compiler (biên dịch bytecode thành mã máy native khi phát hiện Hot Code).',
        keywords: ['interpreter', 'jit', 'mã máy', 'native', 'hot code', 'biên dịch'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Tiered Compilation gồm 5 level (Level 0: Interpreter; Level 1-3: C1 Compiler với mức profiling tăng dần; Level 4: C2 Compiler tối ưu sâu nhất).',
        keywords: ['tiered compilation', 'c1', 'c2', 'level 0', 'level 4', 'profiling'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'C2 áp dụng các tối ưu tối thượng như Method Inlining, Escape Analysis (cấp phát object trên Stack thay vì Heap), Loop Unrolling và Dead Code Elimination.',
        keywords: ['method inlining', 'escape analysis', 'cấp phát stack', 'loop unrolling', 'tối ưu'],
        weight: 30
      }
    ],
    idealAnswer: 'JVM HotSpot sử dụng kỹ thuật Biên dịch phân tầng (Tiered Compilation) kết hợp giữa Interpreter (thông dịch) và JIT Compiler: 1. Level 0 (Interpreter): Ứng dụng khởi động ngay lập tức bằng cách đọc từng lệnh bytecode, đồng thời đếm số lần gọi phương thức (Invocation Counter) và số lần lặp (Backedge Counter); 2. Level 1 - 3 (C1 Compiler): Khi một phương thức vượt ngưỡng gọi (trở thành "Hot Code"), trình biên dịch C1 nhanh chóng dịch nó sang mã máy native kèm thu thập dữ liệu thống kê (Profiling); 3. Level 4 (C2 Server Compiler): Nếu phương thức tiếp tục được gọi liên tục, C2 sẽ tiếp nhận và áp dụng những kỹ thuật tối ưu hóa siêu cấp: Method Inlining (nhúng thẳng thân hàm vào điểm gọi để triệt tiêu chi phí gọi hàm), Escape Analysis (phân tích thoát: nếu object không thoát khỏi method, JVM cấp phát trực tiếp trên Stack hoặc tách thành biến nguyên thủy Scalar Replacement, hoàn toàn không cần đưa lên Heap hay dọn rác GC), Loop Unrolling và Vector hóa lệnh SIMD. Nếu các giả định của C2 bị phá vỡ (ví dụ tính đa hình xuất hiện class mới), JVM thực hiện Deoptimization hạ cấp về mã thông dịch.',
    trapWarning: 'Hiểu lầm phổ biến: "Mọi object trong Java đều được tạo trên Heap". ➔ Sai! Nhờ Escape Analysis của C2 Compiler, các object không bị escape sẽ được cấp phát ngay trên Stack và biến mất ngay khi method kết thúc mà không gây áp lực lên GC.',
    scoringCriteria: 'Trình bày đủ 3 tầng: Interpreter -> C1 Compiler (Level 1-3 profiling) -> C2 Compiler (Level 4, Method Inlining, Escape Analysis).'
  },
  {
    id: 'java-completable-future-async',
    topic: 'Java Backend',
    level: 'Fresher',
    question: 'CompletableFuture hỗ trợ lập trình bất đồng bộ không đồng bộ (Asynchronous Non-blocking) như thế nào? Nguy cơ tiềm ẩn khi dùng các method *Async() mà không truyền custom Executor là gì?',
    contextPrompt: 'Kiểm tra kỹ năng lập trình hướng sự kiện, gom gộp các tác vụ song song và phòng ngừa rủi ro tắc nghẽn luồng dùng chung trong Spring Boot/Java.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'CompletableFuture cho phép kết chuỗi các tác vụ (thenApply, thenCompose, thenCombine) mà không làm block thread gọi (khắc phục điểm yếu của Future.get()).',
        keywords: ['non-blocking', 'không block', 'thenapply', 'thencompose', 'thencombine', 'future.get()'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Nguy cơ tiềm ẩn: Nếu không truyền Executor, các hàm *Async() mặc định sử dụng ForkJoinPool.commonPool().',
        keywords: ['forkjoinpool.commonpool()', 'commonpool', 'mặc định', 'default executor'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Hậu quả: Kích thước commonPool mặc định bằng số CPU cores - 1. Nếu có tác vụ I/O blocking (gọi DB, HTTP bên ngoài), toàn bộ commonPool sẽ bị kẹt cứng làm nghẽn toàn ứng dụng.',
        keywords: ['kẹt luồng', 'cpu cores', 'blocking i/o', 'nghẽn hệ thống', 'custom threadpool'],
        weight: 30
      }
    ],
    idealAnswer: 'CompletableFuture (ra mắt từ Java 8) giải quyết triệt để vấn đề "Blocking Call" của Future cũ: thay vì phải gọi get() làm dừng luồng hiện tại để chờ kết quả, nó cung cấp mô hình Reactive Functional Chaining thông qua các toán tử như thenApply (map dữ liệu), thenCompose (flat-map gọi tiếp async task), thenCombine (chờ 2 task song song gộp kết quả) và exceptionally/handle để xử lý lỗi bất đồng bộ. Nguy cơ trí mạng: Khi gọi supplyAsync(supplier) hoặc method *Async() mà không chỉ định Executor riêng, Java mặc định đẩy task vào `ForkJoinPool.commonPool()`. Pool dùng chung này có số lượng worker thread chỉ bằng số nhân CPU trừ 1 (Runtime.getRuntime().availableProcessors() - 1, ví dụ container 2 core chỉ có 1 thread!). Nếu ta thực hiện một lệnh Blocking I/O (gọi HTTP hoặc truy vấn database) trong đó, toàn bộ thread của commonPool sẽ bị chiếm dụng, khiến toàn bộ tính năng song song khác trong JVM (như Parallel Streams) bị tê liệt hoàn toàn. Quy tắc Production: Luôn tự tạo custom ThreadPoolExecutor truyền vào làm đối số thứ hai.',
    trapWarning: 'Tuyệt đối không dùng ForkJoinPool.commonPool() cho I/O-bound tasks. CommonPool chỉ được thiết kế cho CPU-bound tasks tính toán số học ngắn hạn.',
    scoringCriteria: 'Nêu được cách thức chaining không block và phân tích thảm họa nghẽn luồng khi dùng mặc định ForkJoinPool.commonPool().'
  },
  {
    id: 'java-reflection-deep-dive',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Java Reflection hoạt động như thế nào? Tại sao Reflection lại làm giảm hiệu năng hệ thống và phá vỡ tính bao đóng (Encapsulation)? Từ Java 9+ (Project Jigsaw) Reflection bị giới hạn ra sao?',
    contextPrompt: 'Kiểm tra hiểu biết nền tảng về cơ chế nạp động class, bảo mật mã nguồn và kiến trúc module trong Java hiện đại.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Reflection cho phép kiểm tra, truy xuất và sửa đổi metadata của Class, Field, Method tại thời điểm Runtime, kể cả các thành phần private bằng setAccessible(true).',
        keywords: ['runtime', 'metadata', 'private', 'setaccessible', 'soi rọi', 'kiểm tra'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Nhược điểm hiệu năng: Vô hiệu hóa tính năng tối ưu JIT Inlining, bỏ qua kiểm tra kiểu lúc biên dịch (Compile-time Type Safety), và tốn chi phí giải mã động tên hàm/tham số.',
        keywords: ['chậm', 'hiệu năng', 'jit inlining', 'type safety', 'giải mã động'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Từ Java 9+ (Jigsaw Module System): Các gói nội bộ của JDK bị đóng chặt; gọi setAccessible(true) vào class module khác sẽ bị ném InaccessibleObjectException trừ khi mở cờ --add-opens.',
        keywords: ['java 9', 'jigsaw', 'module', 'inaccessibleobjectexception', '--add-opens', 'chặn'],
        weight: 30
      }
    ],
    idealAnswer: 'Java Reflection là cơ chế cho phép chương trình kiểm tra (inspect) và thay đổi cấu trúc bên trong (Class, Constructor, Field, Method) tại thời điểm Runtime. Điển hình các framework như Spring IoC, Jackson ObjectMapper, Hibernate dùng nó để tự động quét annotation và khởi tạo bean. Bằng cách gọi `field.setAccessible(true)`, Reflection có thể đọc và ghi cả các thuộc tính `private` mà bình thường trình biên dịch ngăn cấm, từ đó phá vỡ tính bao đóng (Encapsulation) của hướng đối tượng. Nhược điểm: 1. Hiệu năng giảm sút rõ rệt do JIT Compiler không thể thực hiện Method Inlining và tối ưu mã máy; 2. Mất kiểm tra an toàn kiểu ở Compile-time, dễ ném NoSuchMethodException / IllegalAccessException lúc chạy; 3. Từ Java 9 (Project Jigsaw), tính năng đóng gói mạnh (Strong Encapsulation) được kích hoạt: các module JDK không còn cho phép tự do can thiệp vào các API nội bộ (như sun.misc.Unsafe), nếu cố tình setAccessible sẽ bị ném InaccessibleObjectException trừ khi ứng dụng cấu hình JVM flag mở rộng như `--add-opens`.',
    trapWarning: 'Nhiều người nghĩ setAccessible(true) đổi access modifier của field thành public ➔ Sai! Nó chỉ bỏ qua cơ chế kiểm tra bảo mật (Security Manager checks) cho riêng thao tác đó.',
    scoringCriteria: 'Nêu được cách Reflection truy cập private qua setAccessible, các lý do làm chậm (không inline được), và rào chắn module trong Java 9+ (--add-opens).'
  },
  {
    id: 'java-string-constant-pool-internals',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'String Constant Pool (SCP) được lưu trữ ở đâu trong bộ nhớ JVM qua các phiên bản Java? Sự khác biệt giữa `String s = "hello"` và `String s = new String("hello")` là gì? Hàm intern() hoạt động như thế nào?',
    contextPrompt: 'Kiểm tra kiến thức cơ bản nhưng sâu sắc về quản lý bộ nhớ chuỗi ký tự, tối ưu dung lượng RAM và cơ chế deduplication của JVM.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Vị trí SCP: Trước Java 7 nằm ở PermGen (dễ bị OutOfMemoryError: PermGen space). Từ Java 7+ chuyển về phân vùng Heap chính để được GC dọn dẹp bình thường.',
        keywords: ['permgen', 'heap', 'java 7', 'vị trí', 'string constant pool', 'scp'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: '`String s = "hello"` kiểm tra SCP: nếu có thì tái sử dụng con trỏ, nếu chưa thì tạo trong SCP. `new String("hello")` LUÔN tạo thêm một object riêng biệt trên Heap.',
        keywords: ['literal', 'new string', 'tái sử dụng', 'object mới', 'heap riêng biệt'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Hàm intern(): Trả về con trỏ trỏ tới đối tượng tương đương trong SCP; nếu chưa có trong SCP, nó sẽ đưa tham chiếu chuỗi đó vào pool.',
        keywords: ['intern()', 'con trỏ', 'đưa vào pool', 'string pool'],
        weight: 30
      }
    ],
    idealAnswer: 'String Constant Pool (SCP) là một bảng băm đặc biệt do JVM duy trì để lưu trữ các chuỗi ký tự duy nhất nhằm tiết kiệm RAM: 1. Vị trí bộ nhớ: Trong Java 6 trở về trước, SCP nằm ở vùng nhớ cố định Permanent Generation (PermGen) có kích thước rất nhỏ và khó dọn rác, rất dễ gây sập JVM với lỗi OutOfMemoryError: PermGen space. Từ Java 7 trở đi, Oracle đã chuyển toàn bộ SCP sang vùng nhớ Heap chính, giúp các chuỗi không còn ai tham chiếu được Garbage Collector thu hồi bình thường; 2. Bản chất khai báo: Cú pháp String s = "hello" (String Literal) sẽ kiểm tra SCP trước: nếu "hello" đã có sẵn thì trả về luôn con trỏ đó mà không cấp phát thêm, nếu chưa có mới tạo mới trong SCP. Ngược lại, String s = new String("hello") BẮT BUỘC JVM phải cấp phát một đối tượng String hoàn toàn mới trên Heap (và "hello" nếu chưa có vẫn phải tạo trong pool), gây lãng phí bộ nhớ gấp đôi; 3. Hàm intern(): Khi gọi s.intern(), JVM sẽ tra cứu chuỗi s trong SCP; nếu đã có chuỗi bằng nội dung, hàm trả về tham chiếu từ pool; nếu chưa có, nó sẽ thêm tham chiếu của s vào pool và trả về tham chiếu đó.',
    trapWarning: 'Hỏi mẹo: `String s = new String("abc");` tạo ra bao nhiêu object? ➔ Trả lời: Tối đa 2 đối tượng (1 đối tượng bắt buộc trên Heap do từ khóa new, và 1 đối tượng trong String Pool nếu trước đó chuỗi "abc" chưa từng xuất hiện).',
    scoringCriteria: 'Phải giải thích được sự dịch chuyển từ PermGen sang Heap trong Java 7, khác biệt giữa literal vs new String(), và cách hoạt động của intern().'
  },
  {
    id: 'java-fail-fast-vs-fail-safe',
    topic: 'Java Backend',
    level: 'Intern',
    question: 'Sự khác biệt cốt lõi giữa Fail-Fast và Fail-Safe Iterator trong Java Collections là gì? Biến modCount được sử dụng như thế nào và tại sao lại ném ConcurrentModificationException?',
    contextPrompt: 'Kiểm tra hiểu biết về luồng lặp dữ liệu, an toàn đồng thời khi duyệt danh sách và cạm bẫy sửa đổi cấu trúc Collection.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Fail-Fast (ArrayList, HashMap, HashSet): Thao tác trực tiếp trên Collection gốc, lập tức ném ConcurrentModificationException nếu phát hiện dữ liệu bị sửa đổi cấu trúc trong lúc lặp.',
        keywords: ['fail-fast', 'concurrentmodificationexception', 'sửa đổi cấu trúc', 'arraylist', 'hashmap'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Cơ chế hoạt động của modCount: Collection duy trì biến đếm `modCount`. Khi Iterator khởi tạo, nó lưu `expectedModCount = modCount`. Mỗi lần gọi next(), nếu expectedModCount != modCount ➔ Ném Exception ngay.',
        keywords: ['modcount', 'expectedmodcount', 'bằng nhau', 'next()', 'biến đếm'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Fail-Safe (CopyOnWriteArrayList, ConcurrentHashMap): Hoạt động trên bản sao (snapshot/clone) hoặc mảng volatile, không bao giờ ném Exception nhưng tốn thêm RAM và dữ liệu có thể không phải mới nhất.',
        keywords: ['fail-safe', 'bản sao', 'snapshot', 'copyonwritearraylist', 'concurrenthashmap', 'không ném exception'],
        weight: 30
      }
    ],
    idealAnswer: 'Sự khác biệt giữa Fail-Fast và Fail-Safe thể hiện cách Iterator phản ứng khi cấu trúc Collection bị thay đổi (thêm/xóa phần tử) trong lúc đang duyệt: 1. Fail-Fast (có trong ArrayList, HashMap, LinkedList): Hoạt động trực tiếp trên mảng dữ liệu gốc. Collection duy trì một biến nội bộ gọi là `modCount` (modification count), tăng lên 1 mỗi khi có thêm/xóa phần tử. Khi ta tạo Iterator, nó ghi nhớ giá trị `expectedModCount = modCount`. Mỗi khi gọi next() hoặc hasNext(), Iterator so sánh nếu `modCount != expectedModCount`, nó lập tức ném ra `ConcurrentModificationException` để ngăn chặn dữ liệu bị lỗi; 2. Fail-Safe (có trong CopyOnWriteArrayList, ConcurrentHashMap): Iterator hoạt động trên một bản sao chụp thời điểm (Snapshot/Clone) của mảng gốc. Khi một luồng khác thêm/xóa dữ liệu, nó thực hiện trên mảng mới, mảng mà Iterator đang đọc không bị ảnh hưởng, do đó không bao giờ ném ConcurrentModificationException. Đổi lại, Fail-Safe tốn nhiều bộ nhớ RAM do phải clone dữ liệu và chấp nhận tính nhất quán cuối cùng (Eventual Consistency) thay vì đọc được dữ liệu mới nhất tức thì.',
    trapWarning: 'Để xóa phần tử khi đang lặp trong Fail-Fast mà không bị lỗi, ta BẮT BUỘC phải dùng `iterator.remove()` (vì hàm này tự động cập nhật lại expectedModCount = modCount) hoặc dùng Collection.removeIf().',
    scoringCriteria: 'Nêu được vai trò so khớp giữa modCount và expectedModCount của Fail-Fast, và cơ chế Snapshot của Fail-Safe.'
  },

  // ==========================================
  // CHỦ ĐỀ 2: SPRING BOOT (20 CÂU)
  // ==========================================
  {
    id: 'spring-ioc-di',
    topic: 'Spring Boot',
    level: 'Intern',
    question: 'Khái niệm IoC (Inversion of Control) và DI (Dependency Injection) trong Spring Framework là gì? Lợi ích thực tế khi đi làm là gì?',
    contextPrompt: 'Kiểm tra sự hiểu biết về trái tim của Spring Framework: Quản lý Bean và Đảo ngược điều khiển.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'IoC (Đảo ngược điều khiển): Chuyển quyền khởi tạo và quản lý vòng đời đối tượng từ tay lập trình viên sang cho Spring IoC Container.',
        keywords: ['ioc', 'inversion of control', 'đảo ngược điều khiển', 'quản lý vòng đời', 'container'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'DI (Tiêm phụ thuộc): Cơ chế triển khai cụ thể của IoC, trong đó các dependency được Spring tự động tiêm (inject) vào class thay vì class tự dùng lệnh new.',
        keywords: ['di', 'dependency injection', 'tiêm phụ thuộc', 'không dùng new', 'inject'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Lợi ích: Giảm độ phụ thuộc chặt chẽ (Loose Coupling), dễ dàng viết Unit Test bằng cách mock đối tượng, và dễ bảo trì/mở rộng.',
        keywords: ['loose coupling', 'unit test', 'mock', 'dễ bảo trì', 'linh hoạt'],
        weight: 30
      }
    ],
    idealAnswer: 'IoC (Inversion of Control - Đảo ngược điều khiển) là nguyên lý thiết kế chuyển giao quyền khởi tạo, cấu hình và quản lý vòng đời của các đối tượng (Bean) từ tay lập trình viên sang cho Spring Container. DI (Dependency Injection - Tiêm phụ thuộc) là một dạng hiện thực hóa cụ thể của IoC: Thay vì một class tự dùng từ khóa new để tạo các service phụ thuộc, Spring Container sẽ tự động tiêm các dependency đó vào class qua Constructor hoặc Setter. Lợi ích lớn nhất là tạo ra kiến trúc lỏng lẻo (Loose Coupling), giúp việc thay đổi cài đặt dễ dàng và cực kỳ thuận lợi cho việc viết Unit Test bằng cách mock các dependency giả lập.',
    trapWarning: 'Đừng nói "IoC chính là DI". Hãy làm rõ: IoC là một nguyên lý kiến trúc lớn (design principle), còn DI là mẫu thiết kế (design pattern) để hiện thực hóa nguyên lý đó.',
    scoringCriteria: 'Phân biệt rõ IoC (quản lý thay vì tự new) và DI (cơ chế tiêm), nêu được lợi ích cho Unit Test và Loose Coupling.'
  },
  {
    id: 'spring-constructor-injection',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Tại sao chuẩn đi làm lại CẤM dùng Field Injection (@Autowired trực tiếp lên field) và BẮT BUỘC dùng Constructor Injection?',
    contextPrompt: 'Kiểm tra tư duy Clean Code, tính bất biến (Immutability), và kỹ năng viết Unit Test chuyên nghiệp.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Tính bất biến (Immutability): Constructor Injection cho phép khai báo field với từ khóa "final", đảm bảo dependency không thể bị null hoặc bị gán lại sau khi khởi tạo.',
        keywords: ['final', 'bất biến', 'immutable', 'không null'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Dễ viết Unit Test thuần túy: Không cần khởi động Spring Context nặng nề hay dùng Reflection; chỉ cần gọi new Service(mockRepo).',
        keywords: ['unit test', 'new thuần', 'mock', 'không cần context', 'reflection'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Phát hiện lỗi phụ thuộc vòng (Circular Dependency) ngay lúc ứng dụng khởi động (Fail-fast); Field Injection vi phạm tính đóng gói của OOP.',
        keywords: ['circular dependency', 'phụ thuộc vòng', 'fail-fast', 'đóng gói', 'vi phạm oop'],
        weight: 30
      }
    ],
    idealAnswer: 'Field Injection (@Autowired trên field) bị coi là code smell vì 3 lý do: 1. Mất tính bất biến: Không thể khai báo biến là "final", khiến dependency có thể bị gán đè bất cứ lúc nào; 2. Cực kỳ khó viết Unit Test: Muốn test phải bật Spring Context rất chậm hoặc phải dùng ReflectionTestUtils can thiệp vào private field; 3. Che giấu vi phạm Single Responsibility Principle: Một class có thể autowire 10-15 field mà không ai nhận ra. Ngược lại, Constructor Injection (kết hợp @RequiredArgsConstructor của Lombok) bắt buộc dùng "final", phát hiện lỗi phụ thuộc vòng (Circular Dependency) ngay khi khởi động (Fail-fast), và cho phép viết Unit Test cực nhanh bằng new MyService(mockRepo).',
    trapWarning: 'Từ Spring 4.3+, nếu một class chỉ có duy nhất một Constructor thì ta thậm chí không cần phải viết annotation @Autowired lên Constructor đó nữa.',
    scoringCriteria: 'Cần nêu được tính bất biến (final), dễ viết Unit Test và phát hiện lỗi Circular Dependency lúc khởi động.'
  },
  {
    id: 'spring-bean-lifecycle',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Vòng đời (Lifecycle) đầy đủ của một Spring Bean diễn ra như thế nào từ lúc container khởi động đến khi tắt ứng dụng?',
    contextPrompt: 'Kiểm tra hiểu biết sâu về Spring Core: Instantiation, Population, BeanPostProcessor, và Destruction.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Giai đoạn khởi tạo: Đọc BeanDefinition -> Khởi tạo instance bằng Constructor -> Tiêm các thuộc tính phụ thuộc (Dependency Injection).',
        keywords: ['khởi tạo', 'constructor', 'instantiate', 'tiêm thuộc tính', 'dependency'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Giai đoạn cấu hình: Gọi các Aware interfaces -> BeanPostProcessor (before/after) -> Chạy hàm khởi tạo @PostConstruct hoặc afterPropertiesSet().',
        keywords: ['aware', 'beanpostprocessor', '@postconstruct', 'afterpropertiesset', 'init'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'BeanPostProcessor sau đó tạo Dynamic Proxy cho AOP (@Transactional, @Async). Khi tắt ứng dụng gọi @PreDestroy để dọn dẹp tài nguyên.',
        keywords: ['proxy', 'aop', '@predestroy', 'tiêu hủy', 'destroy', 'dọn dẹp'],
        weight: 30
      }
    ],
    idealAnswer: 'Vòng đời của Spring Bean trải qua các bước chính: 1. Khởi tạo đối tượng (Instantiate) thông qua Constructor; 2. Tiêm các dependency (Populate Properties); 3. Gọi các Aware Interfaces (BeanNameAware, ApplicationContextAware); 4. BeanPostProcessor.postProcessBeforeInitialization; 5. Gọi hàm khởi tạo: Method đánh dấu @PostConstruct -> InitializingBean.afterPropertiesSet(); 6. BeanPostProcessor.postProcessAfterInitialization (đây là nơi Spring bọc Bean bằng CGLIB/JDK Proxy cho @Transactional, @Async); 7. Bean sẵn sàng phục vụ; 8. Khi đóng container: Gọi hàm dọn dẹp @PreDestroy -> DisposableBean.destroy().',
    trapWarning: 'Cạm bẫy: Tuyệt đối không gọi logic nghiệp vụ phụ thuộc vào các field được tiêm bên trong Constructor, vì lúc đó field có thể vẫn đang là null! Hãy đặt logic khởi tạo vào @PostConstruct.',
    scoringCriteria: 'Nêu đủ các giai đoạn: Constructor -> Dependency Injection -> Aware -> BeanPostProcessor -> @PostConstruct -> @PreDestroy.'
  },
  {
    id: 'spring-component-service-repo',
    topic: 'Spring Boot',
    level: 'Intern',
    question: 'Phân biệt sự khác nhau giữa @Component, @Service, @Repository và @Controller trong Spring Boot?',
    contextPrompt: 'Kiểm tra hiểu biết về Stereotype Annotations và phân tầng kiến trúc 3-tier.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: '@Component là annotation chung bao quát nhất, đánh dấu một class là Spring Bean được IoC Container quản lý.',
        keywords: ['@component', 'chung', 'tổng quát', 'spring bean', 'quản lý'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: '@Service dùng cho tầng Business Logic, @Controller/@RestController dùng cho tầng Web API, @Repository dùng cho tầng DAO/truy cập dữ liệu.',
        keywords: ['@service', 'business', 'nghiệp vụ', '@controller', 'web', '@repository', 'dao', 'database'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Tính năng đặc biệt của @Repository: Tự động bắt và chuyển đổi (translate) các ngoại lệ SQL cấp thấp thành DataAccessException của Spring.',
        keywords: ['dataaccessexception', 'chuyển đổi ngoại lệ', 'exception translation', 'sql exception'],
        weight: 30
      }
    ],
    idealAnswer: '@Component là annotation gốc tổng quát nhất, đánh dấu bất kỳ Java class nào là một Spring-managed Bean. Ba annotation còn lại đều kế thừa (meta-annotated) từ @Component nhưng mang ý nghĩa phân tầng kiến trúc: 1. @Service: Dành riêng cho tầng nghiệp vụ (Business Logic); 2. @Controller / @RestController: Dành cho tầng điều khiển nhận request HTTP và trả dữ liệu JSON; 3. @Repository: Dành cho tầng truy xuất cơ sở dữ liệu. Điểm đặc biệt là @Repository tự động kích hoạt cơ chế Exception Translation, chuyển đổi các ngoại lệ SQL của JDBC/Hibernate thành DataAccessException thống nhất của Spring.',
    trapWarning: 'Nếu bạn thay @Service bằng @Component thì code vẫn chạy được, nhưng vi phạm quy ước kiến trúc và làm mất đi khả năng gắn các AOP Pointcut dành riêng cho Service layer.',
    scoringCriteria: 'Phân biệt rõ mục đích phân tầng kiến trúc 3 tầng và tính năng Exception Translation của @Repository.'
  },
  {
    id: 'spring-transactional-self-invocation',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Tại sao khi một method gọi nội bộ một method khác có gắn @Transactional trong cùng một class (Self-Invocation) thì Transaction lại KHÔNG hoạt động?',
    contextPrompt: 'Kiểm tra hiểu biết về bản chất Spring AOP Proxy Pattern và cạm bẫy thực tế khi dùng @Transactional.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Spring AOP hoạt động dựa trên cơ chế bọc Proxy (Proxy Pattern) bao bọc xung quanh bean thật.',
        keywords: ['proxy', 'aop', 'lớp bọc', 'proxy pattern', 'cglib', 'dynamic proxy'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Khi gọi nội bộ this.methodB(), lời gọi hàm diễn ra trực tiếp trong đối tượng thật (Target Instance) mà không đi qua lớp vỏ Proxy, làm annotation @Transactional bị bỏ qua.',
        keywords: ['this', 'nội bộ', 'không qua proxy', 'bỏ qua', 'bị lờ đi', 'self-invocation'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Cách khắc phục: Tách methodB() sang một Service độc lập khác rồi tiêm vào, hoặc tự tiêm chính mình bằng @Lazy self.',
        keywords: ['tách service', 'class riêng', 'inject', 'tách riêng', '@lazy'],
        weight: 25
      }
    ],
    idealAnswer: 'Spring AOP hiện thực hóa @Transactional bằng cách tạo một lớp vỏ bọc Proxy (CGLIB hoặc JDK Dynamic Proxy) xung quanh Bean. Khi một đối tượng bên ngoài gọi bean.methodA(), lời gọi đi qua Proxy; Proxy sẽ mở Transaction, gọi method thật, rồi commit hoặc rollback. Tuy nhiên, khi một method trong cùng class gọi this.methodB() (nơi có @Transactional), lời gọi diễn ra cục bộ trực tiếp trên instance thật mà không hề đi qua lớp vỏ Proxy. Do đó, logic mở transaction bị bỏ qua hoàn toàn! Cách giải quyết chuẩn mực là tách methodB() sang một Service khác hoặc tiêm chính Service đó với @Lazy.',
    trapWarning: 'Cạm bẫy tương tự: Đánh dấu @Transactional trên method có phạm vi private hoặc protected cũng hoàn toàn vô tác dụng vì CGLIB proxy không thể override private method!',
    scoringCriteria: 'Phải giải thích được cơ chế Spring AOP Proxy và lý do gọi nội bộ this.method() bỏ qua lớp Proxy.'
  },
  {
    id: 'spring-restcontroller-advice-rfc7807',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Cơ chế xử lý ngoại lệ tập trung (Global Exception Handling) bằng @RestControllerAdvice trong Spring Boot hoạt động như thế nào?',
    contextPrompt: 'Kiểm tra kỹ năng thiết kế RESTful API chuẩn mực, xử lý lỗi nhất quán và chuẩn RFC 7807 Problem Details.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: '@RestControllerAdvice sử dụng Spring AOP để bắt (intercept) tất cả các Exception ném ra từ bất kỳ Controller nào trong toàn bộ ứng dụng.',
        keywords: ['@restcontrolleradvice', 'aop', 'chặn', 'intercept', 'bắt lỗi', 'toàn cục', 'tập trung'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Dùng @ExceptionHandler định tuyến từng loại Exception (ResourceNotFoundException, MethodArgumentNotValidException) về method xử lý tương ứng.',
        keywords: ['@exceptionhandler', 'từng loại', 'định tuyến', 'phân loại lỗi'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Định dạng phản hồi lỗi chuẩn quốc tế (như RFC 7807 ProblemDetail trong Spring Boot 3) gồm: status, title, detail, timestamp, errorCode.',
        keywords: ['rfc 7807', 'problemdetail', 'format chuẩn', 'cấu trúc nhất quán', 'status'],
        weight: 30
      }
    ],
    idealAnswer: '@RestControllerAdvice là sự kết hợp giữa @ControllerAdvice và @ResponseBody, hoạt động như một tầng AOP Interceptor chặn bắt tất cả các ngoại lệ ném ra từ các tầng Controller. Bên trong, ta định nghĩa các method kèm @ExceptionHandler(TênException.class) để xử lý riêng từng loại lỗi (ví dụ ResourceNotFoundException trả 404, MethodArgumentNotValidException trả 422). Trong Spring Boot 3, chuẩn khuyến nghị là trả về đối tượng ProblemDetail theo chuẩn RFC 7807 bao gồm timestamp, status, detail, instance và các trường mở rộng. Điều này giúp Frontend nhận được cấu trúc lỗi thống nhất 100% thay vì phải xử lý lỗi phân tán.',
    trapWarning: 'Không bao giờ để lộ stacktrace Java chi tiết ra ngoài môi trường Production vì sẽ làm lộ cấu trúc code và lỗ hổng bảo mật cho hacker.',
    scoringCriteria: 'Nêu được cách dùng @RestControllerAdvice kết hợp @ExceptionHandler và chuẩn hóa cấu trúc lỗi RFC 7807.'
  },
  {
    id: 'spring-validation-notnull-blank',
    topic: 'Spring Boot',
    level: 'Intern',
    question: 'Phân biệt sự khác nhau giữa @NotNull, @NotEmpty và @NotBlank trong Jakarta Bean Validation?',
    contextPrompt: 'Kiểm tra kỹ năng validate dữ liệu đầu vào DTO của API.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: '@NotNull: Chỉ kiểm tra giá trị khác null; chấp nhận chuỗi rỗng "" hoặc chuỗi chứa khoảng trắng "   ". Áp dụng cho mọi Object.',
        keywords: ['@notnull', 'khác null', 'chấp nhận rỗng', 'mọi kiểu'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: '@NotEmpty: Giá trị không được null VÀ độ dài/kích thước phải > 0; chấp nhận chuỗi chứa toàn khoảng trắng "   ". Áp dụng cho String, List, Map, Array.',
        keywords: ['@notempty', 'kích thước > 0', 'độ dài > 0', 'chấp nhận khoảng trắng', 'collection'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: '@NotBlank: Không null, độ dài > 0 VÀ sau khi trim() không được rỗng (chặn chuỗi toàn phím Space). Dành riêng cho String.',
        keywords: ['@notblank', 'trim', 'khoảng trắng', 'space', 'chỉ cho string', 'chuỗi'],
        weight: 30
      }
    ],
    idealAnswer: '1. @NotNull: Chỉ kiểm tra biến khác null. Nếu là chuỗi, nó vẫn chấp nhận chuỗi rỗng "" hoặc chuỗi toàn dấu cách "   ". Dùng được cho mọi kiểu dữ liệu (Integer, Date...); 2. @NotEmpty: Yêu cầu biến không null VÀ kích thước phải lớn hơn 0. Tuy nhiên nó vẫn chấp nhận chuỗi "   " vì length > 0. Dùng cho String, Collection, Map hoặc Mảng; 3. @NotBlank: Là ràng buộc khắt khe nhất dành riêng cho String: Không null, length > 0 và sau khi trim() loại bỏ khoảng trắng thì độ dài vẫn phải > 0. Khi validate các trường văn bản người dùng (như username, password), 99% phải dùng @NotBlank.',
    trapWarning: 'Nếu bạn đặt @NotBlank trên một trường số Integer age thì ứng dụng sẽ quăng lỗi UnexpectedTypeException lúc chạy, vì @NotBlank chỉ hỗ trợ CharSequence/String!',
    scoringCriteria: 'Phân biệt chính xác giữa kiểm tra null, length > 0 và xử lý chuỗi toàn khoảng trắng sau khi trim().'
  },
  {
    id: 'spring-jwt-authentication-flow',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Luồng xác thực người dùng bằng JWT (JSON Web Token) trong Spring Security diễn ra như thế nào?',
    contextPrompt: 'Kiểm tra kiến trúc Security Filter Chain, Stateless Authentication và JWT Verification.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Đăng nhập: Client gửi user/pass -> Server xác thực thành công -> Sinh cặp token (Access Token & Refresh Token) gửi về client.',
        keywords: ['đăng nhập', 'xác thực', 'sinh token', 'access token', 'refresh token'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Xác thực request tiếp theo: Client gửi Authorization: Bearer <token> -> JwtAuthenticationFilter chặn lại để giải mã và kiểm tra chữ ký Signature.',
        keywords: ['bearer', 'authorization', 'filter', 'chữ ký', 'signature', 'giải mã'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Lưu ngữ cảnh: Nếu token hợp lệ, tạo UsernamePasswordAuthenticationToken và lưu vào SecurityContextHolder để các filter sau kiểm tra quyền.',
        keywords: ['securitycontextholder', 'authentication', 'hợp lệ', 'context', 'quyền'],
        weight: 30
      }
    ],
    idealAnswer: 'Luồng xác thực JWT gồm 2 giai đoạn: 1. Đăng nhập: Người dùng gửi thông tin đăng nhập, AuthenticationManager xác thực; nếu đúng, server tạo JWT (ký bằng Secret Key với thuật toán HMAC-SHA256) trả về cho client; 2. Xác thực các request sau: Client đính kèm header "Authorization: Bearer <token>". Request đi qua JwtAuthenticationFilter (kế thừa OncePerRequestFilter). Filter này trích xuất token, kiểm tra hạn sử dụng và xác minh chữ ký (Signature). Nếu token hợp lệ, trích xuất username và roles, tạo đối tượng UsernamePasswordAuthenticationToken rồi gán vào SecurityContextHolder. Cuối cùng, Spring Security cho phép request tiếp tục đi vào Controller.',
    trapWarning: 'Vì JWT là Stateless (không lưu session trên RAM server), nếu muốn thu hồi (revoke) token trước hạn khi user đổi mật khẩu, ta phải áp dụng Blacklist trên Redis hoặc Refresh Token Rotation.',
    scoringCriteria: 'Mô tả được luồng gửi Bearer token, giải mã kiểm tra Signature và lưu Authentication vào SecurityContextHolder.'
  },
  {
    id: 'spring-dto-vs-entity',
    topic: 'Spring Boot',
    level: 'Intern',
    question: 'Tại sao CẤM trả trực tiếp Hibernate Entity ra ngoài REST Controller mà bắt buộc phải chuyển đổi sang DTO?',
    contextPrompt: 'Kiểm tra tư duy bảo mật thông tin, tránh LazyInitializationException và ngắt phụ thuộc tầng dữ liệu.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Bảo mật: Tránh lộ các trường nhạy cảm của cơ sở dữ liệu như password_hash, salt, cờ nội bộ ra bên ngoài API.',
        keywords: ['bảo mật', 'lộ mật khẩu', 'password', 'nhạy cảm', 'security'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Tránh lỗi tuần hoàn JSON (Infinite Recursion) do quan hệ hai chiều (@OneToMany / @ManyToOne) và tránh LazyInitializationException khi session đã đóng.',
        keywords: ['vòng lặp vô tận', 'infinite recursion', 'lazyinitializationexception', 'json', 'quan hệ'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Độc lập kiến trúc: Giúp tầng API không bị phụ thuộc cứng vào cấu trúc bảng Database, dễ dàng thay đổi DB mà không làm vỡ hợp đồng API của Frontend.',
        keywords: ['hợp đồng api', 'độc lập', 'decouple', 'frontend', 'không vỡ'],
        weight: 30
      }
    ],
    idealAnswer: 'Không bao giờ được trả Entity trực tiếp ra Controller vì 3 lý do sống còn: 1. Rò rỉ thông tin bảo mật (Security Leak): Entity thường chứa các trường nhạy cảm như passwordHash, resetToken; trả trực tiếp sẽ vô tình phơi bày dữ liệu này; 2. Lỗi tuần hoàn JSON (Infinite Recursion) & Lazy: Nếu có quan hệ 2 chiều giữa User và Order, Jackson ObjectMapper serialize sẽ chạy vòng lặp vô tận dẫn đến sập RAM, hoặc ném LazyInitializationException nếu session JPA đã đóng; 3. Phá vỡ hợp đồng API: DTO đóng vai trò hợp đồng giao tiếp ổn định với Frontend. Khi ta thay đổi cấu trúc bảng trong Database, DTO giúp đảm bảo API không bị thay đổi làm gãy ứng dụng mobile/web.',
    trapWarning: 'Dùng MapStruct hoặc ModelMapper để tự động chuyển đổi giữa Entity và DTO trong thời gian biên dịch (compile-time) cực nhanh mà không cần viết tay setter.',
    scoringCriteria: 'Nêu rõ 3 yếu tố: Bảo mật thông tin, tránh Infinite Recursion / LazyException, và tính độc lập của hợp đồng API.'
  },
  {
    id: 'spring-profiles-external-config',
    topic: 'Spring Boot',
    level: 'Intern',
    question: 'Cách quản lý cấu hình đa môi trường (dev, test, prod) trong Spring Boot bằng Spring Profiles và Biến Môi Trường?',
    contextPrompt: 'Kiểm tra kỹ năng DevOps cơ bản, 12-Factor App và bảo mật cấu hình ứng dụng.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Dùng Spring Profiles tách các file cấu hình riêng biệt: application-dev.yml (cho local/dev), application-prod.yml (cho production).',
        keywords: ['profiles', 'application-dev', 'application-prod', 'môi trường riêng', 'tách file'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Kích hoạt profile bằng biến SPRING_PROFILES_ACTIVE hoặc tham số --spring.profiles.active=prod.',
        keywords: ['spring_profiles_active', 'kích hoạt', 'active profile', 'tham số'],
        weight: 30
      },
      {
        id: 'p3',
        pointText: 'Tuyệt đối không hardcode mật khẩu; sử dụng biến môi trường hệ thống (${DB_PASSWORD}) để nạp động lúc deploy.',
        keywords: ['biến môi trường', 'environment variable', 'không hardcode', 'mật khẩu', 'secret'],
        weight: 35
      }
    ],
    idealAnswer: 'Để quản lý cấu hình chuẩn theo phương pháp 12-Factor App: Ta sử dụng file cấu hình chung application.yml chứa các thông số mặc định, kết hợp các file profile riêng: application-dev.yml (cho môi trường local dùng H2/Docker) và application-prod.yml (cho production). Khi triển khai, ta kích hoạt profile mong muốn bằng biến môi trường SPRING_PROFILES_ACTIVE=prod hoặc cờ dòng lệnh --spring.profiles.active=prod. Quan trọng nhất: Tất cả thông tin nhạy cảm như URL Database, mật khẩu, JWT Secret đều không được hardcode mà phải khai báo dạng tham chiếu biến môi trường như spring.datasource.password=\${DB_PASSWORD}.',
    trapWarning: 'File .env hoặc các file cấu hình chứa mật khẩu thật phải luôn được đưa vào .gitignore ngay từ commit đầu tiên của dự án.',
    scoringCriteria: 'Giải thích cách dùng application-dev.yml, application-prod.yml và nạp mật khẩu qua biến môi trường.'
  },
  {
    id: 'spring-auto-configuration-internals',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Cơ chế Auto-Configuration trong Spring Boot hoạt động như thế nào? Sự khác nhau giữa spring.factories và AutoConfiguration.imports trong Spring Boot 3 là gì? Các annotation @Conditional đóng vai trò gì?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về ma thuật tự động cấu hình của Spring Boot và sự thay đổi kiến trúc ở Spring Boot 3.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: '@EnableAutoConfiguration kích hoạt AutoConfigurationImportSelector, đọc danh sách các AutoConfiguration class từ file cấu hình SPI.',
        keywords: ['@enableautoconfiguration', 'autoconfigurationimportselector', 'nạp cấu hình', 'spi', 'quét'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Khác biệt phiên bản: Boot 2.x nạp từ META-INF/spring.factories. Boot 2.7 & 3.x chuyển sang META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports để tăng tốc độ nạp.',
        keywords: ['spring.factories', 'autoconfigure.imports', 'boot 3', 'boot 2.7', 'tối ưu nạp'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Bộ lọc điều kiện @Conditional: Chỉ kích hoạt bean khi thỏa mãn @ConditionalOnClass, @ConditionalOnMissingBean, @ConditionalOnProperty.',
        keywords: ['@conditionalonclass', '@conditionalonmissingbean', '@conditionalonproperty', 'điều kiện', 'override'],
        weight: 30
      }
    ],
    idealAnswer: 'Auto-Configuration trong Spring Boot hoạt động dựa trên annotation @EnableAutoConfiguration (được tích hợp sẵn trong @SpringBootApplication). Khi ứng dụng khởi động: 1. AutoConfigurationImportSelector được kích hoạt để nạp danh sách các cấu hình tự động. Trong Spring Boot 1.x và 2.x, danh sách này được khai báo trong file META-INF/spring.factories dưới key EnableAutoConfiguration. Từ Spring Boot 2.7 và chính thức ở Spring Boot 3.0, Spring đã chuyển sang sử dụng file chuẩn mới META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports. File mới này là danh sách từng dòng các class cấu hình, giúp Spring nạp nhanh hơn, dễ sắp xếp thứ tự và tránh overhead đọc toàn bộ file monolithic factories; 2. Cơ chế lọc điều kiện bằng họ annotation @Conditional: Mỗi AutoConfiguration class được gác cổng bởi các điều kiện như @ConditionalOnClass(DataSource.class) (chỉ chạy nếu thư viện có trong Classpath), @ConditionalOnMissingBean(DataSource.class) (chỉ chạy nếu lập trình viên CHƯA tự định nghĩa Bean DataSource riêng), và @ConditionalOnProperty (chỉ bật khi cấu hình yaml kích hoạt). Nhờ đó, Spring Boot cung cấp cấu hình mặc định nhưng người dùng vẫn có thể ghi đè (override) 100% dễ dàng.',
    trapWarning: 'Nếu bạn tự viết 1 Custom Bean cùng tên hoặc cùng kiểu với Bean của Spring Boot, Spring Boot sẽ ưu tiên dùng Bean của bạn và tự động vô hiệu hóa Bean mặc định nhờ có @ConditionalOnMissingBean.',
    scoringCriteria: 'Nêu được vai trò AutoConfigurationImportSelector, sự chuyển đổi sang AutoConfiguration.imports trong Boot 3, và vai trò của @ConditionalOnClass/@ConditionalOnMissingBean.'
  },
  {
    id: 'spring-boot-starter-custom',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Cách thiết kế một Custom Spring Boot Starter chuẩn production? Tại sao chuẩn Spring khuyến nghị tách thành 2 module: autoconfigure module và starter module?',
    contextPrompt: 'Kiểm tra năng lực thiết kế framework nội bộ (SDK/Platform Engineering) cho các hệ thống doanh nghiệp lớn.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Tách 2 module theo chuẩn Spring: module autoconfigure (chứa toàn bộ code logic, @Configuration, @Conditional, properties) và module starter (empty jar chỉ chứa pom/gradle dependencies).',
        keywords: ['2 module', 'autoconfigure module', 'starter module', 'empty jar', 'chuẩn spring'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'Quy ước đặt tên: Thư viện của bên thứ ba/doanh nghiệp có định dạng [feature]-spring-boot-starter, không được bắt đầu bằng spring-boot-starter-[feature] (dành riêng cho Spring team).',
        keywords: ['quy ước đặt tên', 'naming convention', 'tiền tố', 'hậu tố'],
        weight: 30
      },
      {
        id: 'p3',
        pointText: 'Khai báo @ConfigurationProperties kết hợp file AutoConfiguration.imports và cấu hình spring-configuration-metadata.json để hỗ trợ IDE auto-complete.',
        keywords: ['configurationproperties', 'metadata', 'ide auto-complete', 'imports'],
        weight: 30
      }
    ],
    idealAnswer: 'Một Custom Spring Boot Starter chuẩn doanh nghiệp cho phép đóng gói các thư viện dùng chung (như Common Logging, JWT Security, Audit Trail) để các service khác chỉ cần import là chạy ngay. Cấu trúc chuẩn gồm 2 module: 1. xxx-spring-boot-autoconfigure: Chứa toàn bộ code thực thi logic, class @ConfigurationProperties để map file application.yml, các AutoConfiguration class kèm các điều kiện @ConditionalOnClass, @ConditionalOnMissingBean, và file đăng ký META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports; 2. xxx-spring-boot-starter: Là một module rỗng (empty artifact), không chứa bất kỳ file code Java nào mà chỉ chứa file pom.xml/build.gradle khai báo dependency trỏ tới module autoconfigure và các thư viện phụ thuộc (ví dụ client HTTP, Redis driver). Lý do tách biệt: Giúp người dùng có thể tái sử dụng module autoconfigure trong môi trường không dùng starter, quản lý transitive dependency gọn gàng và tuân thủ chặt chẽ kiến trúc của Spring Team. Quy ước đặt tên: Thư viện bên thứ ba phải đặt tên là [feature]-spring-boot-starter, không được bắt đầu bằng spring-boot-starter-* vì tiền tố này được bảo lưu riêng cho hệ sinh thái chính thức của VMware Spring.',
    trapWarning: 'Thiếu dependency spring-boot-configuration-processor sẽ khiến IDE không thể tự động gợi ý (code completion) các thuộc tính cấu hình trong file application.yml.',
    scoringCriteria: 'Giải thích được cấu trúc 2 module (autoconfigure vs starter empty jar), quy ước đặt tên và cách đăng ký AutoConfiguration.'
  },
  {
    id: 'spring-aop-proxies-jdk-cglib',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Spring AOP sử dụng JDK Dynamic Proxy và CGLIB Proxy như thế nào? Tại sao từ Spring Boot 2.x trở đi mặc định chuyển sang CGLIB? Lỗi tự gọi (Self-invocation) trong Spring AOP là gì?',
    contextPrompt: 'Kiểm tra hiểu biết bản chất Proxy Pattern bên dưới @Transactional, @Async, @Cacheable và cạm bẫy self-invocation.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'JDK Dynamic Proxy: Tạo proxy class runtime dựa trên Interface (java.lang.reflect.Proxy), target object bắt buộc phải implement Interface.',
        keywords: ['jdk dynamic proxy', 'interface', 'reflect.proxy', 'bắt buộc interface'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'CGLIB Proxy: Tạo proxy bằng cách sinh bytecode kế thừa (subclassing) từ target class tại runtime, không cần Interface nhưng class và method không được final.',
        keywords: ['cglib', 'subclassing', 'kế thừa', 'bytecode', 'không được final'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Boot 2.x/3.x mặc định bật proxy-target-class=true (CGLIB) để tránh ClassCastException. Lỗi Self-invocation: Gọi method nội bộ qua `this` sẽ bypass Proxy làm vô hiệu hóa annotation.',
        keywords: ['spring boot 2', 'cglib mặc định', 'self-invocation', 'this', 'bypass proxy'],
        weight: 30
      }
    ],
    idealAnswer: 'Spring AOP hoạt động dựa trên mô hình Proxy bao bọc quanh Bean thực tế: 1. JDK Dynamic Proxy: Được tích hợp sẵn trong JDK (java.lang.reflect.Proxy), tạo ra proxy object implement lại các Interface của target object. Điểm yếu là nếu một class không implement bất kỳ interface nào, JDK Proxy sẽ không thể tạo được; 2. CGLIB Proxy: Sử dụng thư viện thao tác bytecode để sinh ra một lớp con (subclass) kế thừa trực tiếp từ target class. Do đó nó không đòi hỏi Interface, nhưng nhược điểm là target class và method không được khai báo final; 3. Từ Spring Boot 2.x trở đi, Spring mặc định chuyển sang dùng CGLIB (spring.aop.proxy-target-class=true) để loại bỏ sự khác biệt hành vi, tránh lỗi ClassCastException khi lập trình viên tiêm Service bằng chính tên Class thay vì Interface; 4. Cạm bẫy Self-invocation (Tự gọi): Khi Method A gọi Method B trong cùng một Class, cuộc gọi diễn ra trực tiếp qua con trỏ this của đối tượng thực tế chứ không đi qua Spring Proxy bọc bên ngoài. Hậu quả là các annotation như @Transactional, @Async, @Cacheable trên Method B sẽ hoàn toàn bị vô hiệu hóa.',
    trapWarning: 'Cách khắc phục Self-invocation: Tách Method B sang một Service riêng biệt rồi inject vào, hoặc tự tiêm chính mình (@Autowired private SelfService self;), hoặc lấy proxy thông qua AopContext.currentProxy().',
    scoringCriteria: 'Phân biệt rõ cơ chế Interface (JDK) vs Subclassing (CGLIB), lý do Boot 2+ chọn CGLIB làm mặc định, và phân tích hiện tượng self-invocation.'
  },
  {
    id: 'spring-security-filter-chain',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Luồng xử lý một HTTP Request trong Spring Security diễn ra như thế nào? DelegatingFilterProxy và FilterChainProxy có vai trò gì? Thứ tự các filter cốt lõi ra sao?',
    contextPrompt: 'Kiểm tra kiến thức cốt lõi về cơ chế bảo mật tầng Servlet Filter và kiến trúc nội bộ của Spring Security.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Cầu nối: Servlet Container (Tomcat) không quản lý Spring Bean. DelegatingFilterProxy là Servlet Filter chuẩn đóng vai trò cầu nối, chuyển tiếp request vào FilterChainProxy.',
        keywords: ['delegatingfilterproxy', 'servlet container', 'cầu nối', 'chuyển tiếp', 'filter'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'FilterChainProxy quản lý danh sách SecurityFilterChain, lựa chọn chain phù hợp dựa trên URL RequestMatcher và điều phối các filter bảo mật tuần tự.',
        keywords: ['filterchainproxy', 'securityfilterchain', 'requestmatcher', 'điều phối'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Thứ tự filter cốt lõi: SecurityContextHolderFilter -> CorsFilter/CsrfFilter -> AuthenticationFilter (JWT/UsernamePassword) -> AuthorizationFilter -> DispatcherServlet.',
        keywords: ['thứ tự filter', 'securitycontextholderfilter', 'authenticationfilter', 'authorizationfilter', 'dispatcherservlet'],
        weight: 30
      }
    ],
    idealAnswer: 'Kiến trúc Spring Security hoạt động hoàn toàn ở tầng Servlet Filter trước khi request chạm vào DispatcherServlet: 1. Cầu nối DelegatingFilterProxy: Tomcat/Jetty Servlet Container chạy ở vòng đời độc lập và không biết tới Spring IoC Container. Do đó, Spring cung cấp DelegatingFilterProxy đăng ký với Servlet Container để hứng toàn bộ request, sau đó ủy quyền việc xử lý cho một Spring Bean có tên là springSecurityFilterChain; 2. Trọng tài FilterChainProxy: Bean này thực chất là FilterChainProxy, nắm giữ danh sách các SecurityFilterChain. Nó so khớp request URL để chọn chain tương ứng và bắt đầu chạy qua chuỗi các Filter bảo mật; 3. Luồng filter tuần tự: Đầu tiên là SecurityContextHolderFilter nạp SecurityContext từ Session/ThreadLocal. Tiếp theo là các filter xử lý CORS và CSRF. Kế đến là Authentication Filter (ví dụ BearerTokenAuthenticationFilter giải mã JWT hoặc UsernamePasswordAuthenticationFilter), nếu hợp lệ nó sẽ tạo Authentication object lưu vào SecurityContextHolder. Cuối cùng là AuthorizationFilter kiểm tra quyền hạn (Role/Authority). Nếu vượt qua toàn bộ filter, request mới được chuyển tiếp vào DispatcherServlet và Controller.',
    trapWarning: 'Nếu ném Exception trong Spring Security Filter (trước Controller), @ControllerAdvice / @ExceptionHandler thông thường sẽ KHÔNG bắt được vì Exception xảy ra ở ngoài phạm vi của DispatcherServlet! Phải dùng AuthenticationEntryPoint hoặc AccessDeniedHandler.',
    scoringCriteria: 'Giải thích được vai trò cầu nối của DelegatingFilterProxy, vai trò điều phối của FilterChainProxy, và thứ tự Authentication -> Authorization Filter.'
  },
  {
    id: 'spring-actuator-production-monitoring',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Spring Boot Actuator cung cấp những khả năng gì trong môi trường Production? Cấu hình Kubernetes Liveness và Readiness Probes với Actuator như thế nào và các cạm bẫy bảo mật cần tránh?',
    contextPrompt: 'Kiểm tra kinh nghiệm vận hành Microservices trong môi trường Cloud Native, Kubernetes và giám sát hệ thống (Observability).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Khả năng của Actuator: Cung cấp các Production-ready endpoints để giám sát metrics (Micrometer/Prometheus), trạng thái sức khỏe (Health), thread dump, heap dump, loggers level lúc runtime.',
        keywords: ['actuator', 'metrics', 'micrometer', 'prometheus', 'health', 'heap dump'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Kubernetes Probes: Tách biệt /actuator/health/liveness (kiểm tra app có bị deadlock hay sập không để K8s restart) và /actuator/health/readiness (kiểm tra app sẵn sàng nhận traffic chưa để tạm ngắt routing).',
        keywords: ['liveness', 'readiness', 'kubernetes', 'k8s probe', 'restart pod', 'định tuyến'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Cạm bẫy bảo mật: Không bao giờ mở public `exposure.include=*`. Các endpoint nhạy cảm như /env, /heapdump chứa thông tin mật; bắt buộc phải bảo vệ bằng Spring Security hoặc chạy trên port nội bộ riêng.',
        keywords: ['bảo mật', 'exposure.include', '/env', '/heapdump', 'port nội bộ', 'rò rỉ mật khẩu'],
        weight: 30
      }
    ],
    idealAnswer: 'Spring Boot Actuator là module cung cấp các tính năng sẵn sàng cho Production như giám sát Health Check, thu thập Metrics qua Micrometer kết hợp Prometheus/Grafana, xem thông tin cấu hình, và thay đổi mức Log Level ngay lúc runtime mà không cần khởi động lại app. Khi chạy trên Kubernetes (K8s), Actuator hỗ trợ 2 probe chuẩn: 1. Liveness Probe (/actuator/health/liveness): Xác định container còn sống hay đã bị chết/deadlock. Nếu probe thất bại, K8s sẽ lập tức Kill và Restart lại Pod đó; 2. Readiness Probe (/actuator/health/readiness): Xác định ứng dụng đã sẵn sàng tiếp nhận traffic mạng hay chưa (đã kết nối xong DB, nạp cache xong chưa). Nếu probe này fail, K8s chỉ tạm thời rút Pod ra khỏi Service Endpoint để ngừng định tuyến traffic tới nó, KHÔNG restart Pod; Cạm bẫy bảo mật: Rất nhiều vụ rò rỉ dữ liệu xảy ra do mở toàn bộ endpoint exposure.include=*. Endpoint /heapdump cho phép tải toàn bộ RAM về (chứa token, mật khẩu người dùng), /env phơi bày biến môi trường. Do đó phải giới hạn chỉ mở health,info,prometheus, đặt Actuator trên một cổng mạng nội bộ riêng (ví dụ management.server.port=9090) và khóa bằng Spring Security.',
    trapWarning: 'Tránh để Readiness Probe kiểm tra truy vấn Database sâu bằng query phức tạp trong mọi nhịp ping, vì nếu DB bị nghẽn chậm thì TOÀN BỘ các Pod trong K8s cluster sẽ đồng loạt báo Unready, dẫn đến sập toàn bộ hệ thống.',
    scoringCriteria: 'Nêu được vai trò Actuator, phân biệt rõ bản chất Liveness vs Readiness Probe trên K8s, và nguyên tắc bảo mật endpoint nhạy cảm.'
  },
  {
    id: 'spring-cache-redis-gotchas',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Ba sự cố kinh điển khi sử dụng Caching trong hệ thống quy mô lớn là gì: Cache Penetration, Cache Breakdown, và Cache Avalanche? Cách xử lý triệt để trong Spring Boot là gì?',
    contextPrompt: 'Kiểm tra năng lực giải quyết các bài toán tải cao (High Concurrency), chống sập Database khi có Caching layer.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Cache Penetration (Xuyên thủng): Request truy vấn ID không tồn tại cả ở Cache và DB, khiến mọi request đâm thẳng vào DB. Xử lý: Lưu Cache giá trị Null kèm TTL ngắn, hoặc dùng Bloom Filter.',
        keywords: ['cache penetration', 'xuyên thủng', 'bloom filter', 'cache null', 'không tồn tại'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Cache Breakdown (Hot key hết hạn): Một Key cực hot bất ngờ hết hạn TTL, hàng vạn request đồng thời đâm vào DB để load lại. Xử lý: Dùng Mutex Lock (Distributed Lock Redisson) hoặc @Cacheable(sync = true).',
        keywords: ['cache breakdown', 'hot key hết hạn', 'mutex lock', 'distributed lock', 'sync = true'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Cache Avalanche (Tuyết lở): Hàng loạt Key có cùng TTL hết hạn đồng loạt cùng một thời điểm, khiến DB bị quá tải đột ngột. Xử lý: Thêm thời gian ngẫu nhiên (Jitter / Random TTL) khi set expiry time.',
        keywords: ['cache avalanche', 'tuyết lở', 'đồng loạt hết hạn', 'random ttl', 'jitter'],
        weight: 30
      }
    ],
    idealAnswer: 'Khi sử dụng Redis Cache trong Spring Boot, 3 sự cố kinh điển làm tê liệt Database gồm: 1. Cache Penetration (Xuyên thủng): Kẻ xấu cố tình truy vấn các ID không hề tồn tại (ví dụ ID âm hoặc ID ngẫu nhiên). Dữ liệu không có trong Redis, toàn bộ request xuyên thẳng xuống Database. Xử lý: Khi query DB trả về rỗng, ta vẫn lưu vào Redis giá trị NULL kèm thời gian sống ngắn (1-2 phút) để chặn các request tiếp theo, hoặc sử dụng cấu trúc dữ liệu Bloom Filter ngay từ tầng API Gateway để lọc nhanh các ID không tồn tại; 2. Cache Breakdown (Đục thủng Hot Key): Xảy ra khi một Key có lưu lượng truy cập cực cao (ví dụ Flash Sale một sản phẩm hot) vừa hết hạn TTL. Hàng vạn request đồng thời thấy cache miss và cùng lúc query xuống DB để nạp lại cache. Xử lý: Sử dụng Distributed Lock (Redisson) để chỉ cho phép duy nhất 1 luồng được query DB cập nhật cache, các luồng khác đợi kết quả; hoặc trong Spring Cache bật thuộc tính @Cacheable(sync = true) để đồng bộ luồng cục bộ; 3. Cache Avalanche (Tuyết lở): Hàng triệu Key được nạp cùng một lúc và cài đặt cùng một TTL (ví dụ cùng hết hạn sau 60 phút). Khi đến hạn, toàn bộ dữ liệu biến mất khỏi cache cùng lúc, khiến DB bị nhấn chìm. Xử lý: Thêm một khoảng thời gian ngẫu nhiên (Random Jitter) vào TTL (ví dụ 1 tiếng + ngẫu nhiên từ 1 đến 5 phút) để thời điểm hết hạn của các key được phân tán đều theo thời gian.',
    trapWarning: 'Lưu Cache Null có nhược điểm là làm tốn dung lượng Redis nếu kẻ tấn công spam hàng triệu key rác khác nhau. Lúc này Bloom Filter là giải pháp ưu việt hơn hẳn vì chỉ tốn vài MB RAM.',
    scoringCriteria: 'Định nghĩa chính xác hiện tượng và nêu giải pháp xử lý triệt để cho cả 3 bài toán: Penetration, Breakdown, và Avalanche.'
  },
  {
    id: 'spring-async-threadpool-config',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Tại sao không bao giờ được dùng annotation @Async trong Spring Boot mà không tự cấu hình ThreadPoolTaskExecutor? Cơ chế mặc định của Spring có rủi ro gì và cách cấu hình chuẩn là gì?',
    contextPrompt: 'Kiểm tra hiểu biết về đa luồng trong Spring Framework, quản lý tài nguyên OS thread và phòng chống sập RAM máy chủ.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Nguy cơ mặc định: Nếu không cấu hình Bean TaskExecutor tùy chỉnh, Spring Boot sẽ dùng SimpleAsyncTaskExecutor - tạo Java Thread mới cho MỖI request, không tái sử dụng luồng.',
        keywords: ['simpleasynctaskexecutor', 'tạo thread mới', 'không tái sử dụng', 'mặc định'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Hậu quả sản xuất: Dưới tải cao, hàng ngàn Thread được tạo đồng thời gây cạn kiệt bộ nhớ hệ điều hành (OutOfMemoryError: unable to create new native thread) làm sập ứng dụng.',
        keywords: ['oom', 'unable to create new native thread', 'sập hệ thống', 'cạn kiệt ram', 'hậu quả'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Cấu hình chuẩn: Tự khai báo Bean ThreadPoolTaskExecutor với các giới hạn: corePoolSize, maxPoolSize, queueCapacity, threadNamePrefix, và RejectedExecutionHandler.',
        keywords: ['threadpooltaskexecutor', 'corepoolsize', 'maxpoolsize', 'queuecapacity', 'cấu hình chuẩn'],
        weight: 30
      }
    ],
    idealAnswer: 'Sử dụng @Async mà không cấu hình Thread Pool là một lỗi nghiêm trọng trong Spring Boot: 1. Rủi ro của SimpleAsyncTaskExecutor: Mặc định nếu không tìm thấy Bean kiểu TaskExecutor nào trong context, Spring sẽ dùng SimpleAsyncTaskExecutor. Class này có đặc tính cực kỳ nguy hiểm: Nó không phải là một Thread Pool tái sử dụng tài nguyên, mà mỗi khi có một tác vụ bất đồng bộ được gọi, nó sẽ tạo ra một OS Native Thread hoàn toàn mới rồi vứt bỏ sau khi chạy xong. Khi hệ thống chịu tải cao, việc tạo hàng ngàn Thread cùng lúc sẽ làm cạn kiệt bộ nhớ Native Memory của máy chủ, dẫn đến sụp đổ hệ thống với lỗi java.lang.OutOfMemoryError: unable to create new native thread; 2. Cách cấu hình chuẩn: Luôn định nghĩa một class @Configuration implement AsyncConfigurer hoặc tạo Bean ThreadPoolTaskExecutor: Cấu hình cụ thể corePoolSize (số thread hoạt động thường trực), maxPoolSize (số thread tối đa khi queue đầy), queueCapacity (độ dài hàng đợi đệm có giới hạn, ví dụ 500), đặt threadNamePrefix (ví dụ "async-exec-") để dễ theo dõi trong log, và thiết lập chính sách từ chối an toàn như CallerRunsPolicy để luồng gọi tự xử lý khi hệ thống quá tải.',
    trapWarning: 'Muốn @Async hoạt động bắt buộc phải bật annotation @EnableAsync ở lớp cấu hình chính. Và tương tự như @Transactional, @Async cũng không hoạt động nếu gọi nội bộ (self-invocation) trong cùng một class!',
    scoringCriteria: 'Chỉ ra nhược điểm tạo thread mới vô hạn của SimpleAsyncTaskExecutor và nêu được các thông số cấu hình ThreadPoolTaskExecutor chuẩn.'
  },
  {
    id: 'spring-bean-scopes-and-prototype-trap',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Các Bean Scopes trong Spring là gì? Phân tích "Cạm bẫy Prototype trong Singleton" (Prototype Bean injected into Singleton Bean) và các giải pháp khắc phục triệt để?',
    contextPrompt: 'Kiểm tra kiến thức cốt lõi về vòng đời Bean trong Spring IoC Container và các lỗi logic tinh vi trong hệ thống.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Các Bean Scopes: singleton (mặc định - duy nhất 1 instance trong IoC Container), prototype (tạo instance mới mỗi lần được yêu cầu), và các scope web (request, session, application).',
        keywords: ['singleton', 'prototype', 'request', 'session', 'bean scope'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Cạm bẫy Prototype trong Singleton: Singleton Bean chỉ được khởi tạo 1 lần lúc start app, do đó Prototype Bean tiêm vào nó bị cố định vĩnh viễn, mất hoàn toàn tính chất prototype.',
        keywords: ['cạm bẫy', 'prototype trong singleton', 'tiêm một lần', 'đóng băng', 'mất prototype'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Giải pháp: Sử dụng @Lookup method injection, hoặc dùng ObjectProvider<PrototypeBean>.getObject(), hoặc tiêm ApplicationContext để getBean lúc runtime.',
        keywords: ['@lookup', 'objectprovider', 'getobject()', 'giải pháp', 'method injection'],
        weight: 30
      }
    ],
    idealAnswer: 'Spring hỗ trợ các Bean Scope chính: 1. singleton (mặc định): Đúng 1 instance duy nhất được tạo và chia sẻ trong toàn bộ Spring IoC Container; 2. prototype: Mỗi lần có yêu cầu lấy Bean (getBean hoặc tiêm vào Bean khác), Spring sẽ khởi tạo một instance hoàn toàn mới; 3. Các Web scopes: request (tạo mới cho mỗi HTTP request), session (tồn tại suốt phiên làm việc HTTP Session), application (gắn với ServletContext); Cạm bẫy kinh điển: Khi tiêm một Prototype Bean vào bên trong một Singleton Bean: Do Singleton Bean chỉ được Spring khởi tạo đúng một lần duy nhất lúc ứng dụng khởi động, các dependency bên trong nó cũng chỉ được giải quyết (inject) một lần duy nhất tại thời điểm đó. Kết quả là Prototype Bean này sẽ bị giữ chặt và dùng đi dùng lại mãi mãi trong Singleton Bean, mất hoàn toàn tính chất khởi tạo mới của Prototype! Giải pháp khắc phục chuẩn: Cách 1: Sử dụng ObjectProvider<MyPrototypeBean> (từ Spring 4.3+) và gọi provider.getObject() mỗi khi cần instance mới; Cách 2: Sử dụng Method Injection với annotation @Lookup trên một method để Spring CGLIB tự động override và gọi getBean tại thời điểm thực thi.',
    trapWarning: 'Tránh tiêm trực tiếp ApplicationContext rồi gọi context.getBean() vì cách này vi phạm nguyên lý IoC (biến thành Service Locator Anti-pattern) và gắn chặt mã nguồn vào framework của Spring.',
    scoringCriteria: 'Nêu được các scope cơ bản, phân tích chính xác tại sao prototype bị "đóng băng" trong singleton, và đưa ra giải pháp chuẩn (@Lookup hoặc ObjectProvider).'
  },
  {
    id: 'spring-data-jpa-save-saveandflush',
    topic: 'Spring Boot',
    level: 'Fresher',
    question: 'Sự khác biệt cốt lõi giữa save(), saveAndFlush(), và saveAll() trong Spring Data JPA là gì? Persistence Context và cơ chế Dirty Checking hoạt động như thế nào?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về JPA/Hibernate, bộ nhớ đệm cấp 1 (First-Level Cache) và tối ưu hóa thao tác cơ sở dữ liệu.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Persistence Context & Dirty Checking: Là bộ nhớ đệm cấp 1 (L1 Cache) quản lý các Entity Managed. Khi kết thúc transaction, Hibernate tự so sánh snapshot (Dirty Checking) để tự sinh lệnh UPDATE mà không cần gọi save().',
        keywords: ['persistence context', 'dirty checking', 'l1 cache', 'managed', 'tự động update'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'save(): Đưa Entity vào Persistence Context và trì hoãn (defer) việc bắn SQL INSERT/UPDATE xuống DB cho đến khi Transaction commit (Write-Behind).',
        keywords: ['save()', 'write-behind', 'trì hoãn', 'chưa bắn sql ngay', 'managed'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'saveAndFlush(): Thực hiện save đồng thời gọi ngay entityManager.flush() đẩy SQL xuống DB buffer ngay lập tức, nhưng Transaction VẪN CHƯA commit. saveAll() hỗ trợ JDBC batching.',
        keywords: ['saveandflush()', 'flush', 'chưa commit', 'bắn sql ngay', 'saveall', 'batching'],
        weight: 30
      }
    ],
    idealAnswer: 'Trong Spring Data JPA: 1. Persistence Context & Dirty Checking: Persistence Context đóng vai trò First-Level Cache lưu trữ các Managed Entity. Trong suốt transaction, nếu bạn thay đổi giá trị thuộc tính của Entity, Hibernate sẽ ghi nhận. Khi transaction chuẩn bị commit, cơ chế Dirty Checking sẽ tự động so sánh trạng thái đối tượng với bản snapshot ban đầu và tự động bắn lệnh SQL UPDATE xuống DB mà bạn KHÔNG cần gọi repository.save(); 2. save(): Đưa Entity vào trạng thái Managed trong Persistence Context. Nó KHÔNG lập tức bắn câu lệnh SQL xuống Database mà tận dụng cơ chế Write-Behind để gom nhóm các thao tác ghi và chỉ thực sự bắn SQL khi Transaction chuẩn bị commit hoặc trước khi chạy một câu truy vấn SELECT liên quan; 3. saveAndFlush(): Thực hiện save() đồng thời gọi ngay entityManager.flush(). Nó ép Hibernate phải đẩy ngay lập tức toàn bộ câu lệnh SQL đang tồn đọng xuống Database ngay tại thời điểm đó, tuy nhiên Transaction vẫn chưa được commit (nếu phía sau bị Exception thì vẫn rollback bình thường); 4. saveAll(): Duyệt qua danh sách để save; khi kết hợp với cấu hình hibernate.jdbc.batch_size, nó giúp gom nhiều INSERT/UPDATE thành một batch SQL duy nhất, tăng tốc độ ghi dữ liệu hàng trăm lần.',
    trapWarning: 'Lỗi thường gặp: Nhiều bạn nghĩ saveAndFlush() sẽ commit dữ liệu vĩnh viễn vào DB ➔ Sai! flush chỉ gửi SQL qua kết nối JDBC xuống DB buffer, việc commit chỉ xảy ra khi Transaction kết thúc thành công.',
    scoringCriteria: 'Giải thích được Persistence Context/Dirty Checking, phân biệt save() (trì hoãn flush) vs saveAndFlush() (ép flush tức thì nhưng chưa commit).'
  },
  {
    id: 'spring-resilience4j-circuit-breaker',
    topic: 'Spring Boot',
    level: 'Junior',
    question: 'Mẫu thiết kế Circuit Breaker hoạt động như thế nào trong kiến trúc Microservices với Resilience4j? Giải thích 3 trạng thái CLOSED, OPEN, HALF-OPEN và cơ chế Sliding Window?',
    contextPrompt: 'Kiểm tra kiến thức xây dựng hệ thống phân tán chịu lỗi cao (Fault-Tolerant Microservices).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Mục đích: Ngăn chặn hiện tượng lỗi dây chuyền (Cascading Failure) khi một microservice hạ tầng hoặc đối tác bên thứ ba bị sập hoặc quá tải.',
        keywords: ['circuit breaker', 'cascading failure', 'sập dây chuyền', 'chống quá tải', 'ngăn lỗi'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: '3 trạng thái: CLOSED (bình thường) -> Vượt ngưỡng lỗi -> OPEN (ngắt mạch, từ chối request ngay lập tức/fallback) -> Hết thời gian chờ -> HALF-OPEN (thử nghiệm một số request để quyết định đóng hay mở lại).',
        keywords: ['closed', 'open', 'half-open', 'fallback', 'chuyển trạng thái'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Cơ chế Sliding Window trong Resilience4j: Đếm tỷ lệ lỗi dựa trên số lượng request gần nhất (Count-based) hoặc dựa trên khoảng thời gian gần nhất (Time-based).',
        keywords: ['sliding window', 'count-based', 'time-based', 'tỷ lệ lỗi', 'failure rate threshold'],
        weight: 30
      }
    ],
    idealAnswer: 'Circuit Breaker (Bộ ngắt mạch) là mẫu thiết kế sống còn trong kiến trúc Microservices để bảo vệ hệ thống khỏi thảm họa sập dây chuyền (Cascading Failure) khi một service phụ thuộc gặp sự cố: 1. Ba trạng thái cốt lõi: - CLOSED: Mạch đóng, hệ thống hoạt động bình thường, mọi request được gửi tới downstream service. Mạch theo dõi tỷ lệ lỗi; nếu tỷ lệ lỗi vượt quá ngưỡng cấu hình (ví dụ 50%), mạch sẽ chuyển sang OPEN; - OPEN: Mạch hở, tất cả các request tới service đó bị chặn lại ngay lập tức và ném ra CallNotPermittedException hoặc kích hoạt phương thức Fallback dự phòng mà KHÔNG hề gửi request qua mạng, giúp downstream service có thời gian phục hồi và tránh làm nghẽn worker thread của service gọi; - HALF-OPEN: Sau một khoảng thời gian chờ cấu hình trước (ví dụ 10 giây), mạch tự động chuyển sang HALF-OPEN. Ở trạng thái này, mạch cho phép một số lượng giới hạn request thăm dò đi qua. Nếu các request này thành công, mạch tự động đóng lại (CLOSED) để phục hồi lưu lượng bình thường; nếu vẫn gặp lỗi, nó lập tức mở lại (OPEN) và reset thời gian chờ; 2. Cơ chế Sliding Window trong Resilience4j: Lưu trữ kết quả của các cuộc gọi gần nhất để tính tỷ lệ lỗi, hỗ trợ 2 kiểu: Count-based (ví dụ theo dõi 100 cuộc gọi gần nhất) hoặc Time-based (theo dõi các cuộc gọi trong 60 giây gần nhất).',
    trapWarning: 'Phương thức Fallback trong Resilience4j phải có chữ ký (signature) giống hệt phương thức gốc và phải nhận thêm tham số cuối cùng là Throwable (hoặc Exception cụ thể), nếu không sẽ bị ném NoSuchMethodException.',
    scoringCriteria: 'Giải thích mục đích chống sập dây chuyền, mô tả chính xác vòng đời 3 trạng thái CLOSED -> OPEN -> HALF-OPEN, và cơ chế Sliding Window.'
  },

  // ==========================================
  // CHỦ ĐỀ 3: DATABASE & SQL (20 CÂU)
  // ==========================================
  {
    id: 'db-b-tree-indexing',
    topic: 'Database',
    level: 'Fresher',
    question: 'Chỉ mục B+Tree (Index) trong cơ sở dữ liệu hoạt động như thế nào? Tại sao nó giúp tăng tốc độ tìm kiếm và đánh đổi điều gì?',
    contextPrompt: 'Kiểm tra hiểu biết sâu về cấu trúc dữ liệu lưu trữ vật lý của Database Engine (InnoDB, PostgreSQL).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'B+Tree là cây cân bằng nhiều nhánh (balanced search tree), tất cả dữ liệu thực tế nằm ở các node lá (Leaf Nodes) được liên kết hai chiều với nhau.',
        keywords: ['b+tree', 'cây cân bằng', 'node lá', 'leaf node', 'liên kết'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Tăng tốc: Giảm độ phức tạp từ Full Table Scan O(N) xuống O(log N), giảm thiểu tối đa số lần đọc đĩa I/O (Disk I/O).',
        keywords: ['o(log n)', 'giảm i/o', 'đọc đĩa', 'tránh full scan', 'nhanh'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Đánh đổi: Tốn dung lượng ổ đĩa lưu cây Index, và làm chậm các thao tác ghi (INSERT, UPDATE, DELETE) vì phải tái cân bằng cây.',
        keywords: ['chậm ghi', 'insert update delete', 'tốn đĩa', 'tái cân bằng', 'đánh đổi'],
        weight: 30
      }
    ],
    idealAnswer: 'Chỉ mục B+Tree là một cây tìm kiếm cân bằng nhiều nhánh tự cân bằng. Điểm đặc biệt của B+Tree là các node trung gian chỉ chứa khóa tìm kiếm làm chỉ dẫn đường, toàn bộ dữ liệu hoặc con trỏ bản ghi thực tế đều nằm tại các node lá (Leaf Nodes), và các node lá này được nối với nhau thành một danh sách liên kết hai chiều. Nhờ đó, thay vì phải quét toàn bộ bảng (Full Table Scan) tốn O(N) lần đọc đĩa, Database chỉ mất từ 3-4 lần đọc đĩa (I/O) để tìm chính xác bản ghi với độ phức tạp O(log N), đồng thời hỗ trợ tìm kiếm theo khoảng dải (Range Scan: > <) cực kỳ nhanh. Đánh đổi: Index tốn thêm dung lượng đĩa và làm chậm tốc độ ghi (INSERT/UPDATE/DELETE) do cây phải liên tục tách trang (Page Split) và tái cân bằng.',
    trapWarning: 'Quy tắc Left-Prefix: Trong Composite Index (A, B, C), nếu câu query chỉ tìm theo điều kiện WHERE B = 2 mà không có A, Database KHÔNG THỂ sử dụng được Index!',
    scoringCriteria: 'Giải thích được cấu trúc B+Tree (dữ liệu ở node lá liên kết hai chiều), giảm I/O đĩa và đánh đổi khi ghi.'
  },
  {
    id: 'db-n-plus-one-query',
    topic: 'Database',
    level: 'Fresher',
    question: 'Bệnh N+1 Query trong JPA/Hibernate là gì? Bản chất nguyên nhân và 2 phương pháp đặc trị hiệu quả nhất là gì?',
    contextPrompt: 'Kiểm tra câu hỏi kinh điển nhất của mọi buổi phỏng vấn Java Backend liên quan đến tối ưu truy vấn ORM.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Hiện tượng: Bắn 1 câu query lấy danh sách cha (1 SELECT), sau đó với mỗi bản ghi cha lại bắn thêm 1 câu query lấy dữ liệu con liên quan (N SELECTs).',
        keywords: ['1 query cha', 'n query con', '1 + n', 'hàng ngàn query', 'lặp query'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Nguyên nhân: Do cơ chế Lazy Loading mặc định khi lặp qua danh sách và gọi getter của quan hệ liên kết.',
        keywords: ['lazy loading', 'getter', 'vòng lặp', 'for loop', 'lấy con'],
        weight: 30
      },
      {
        id: 'p3',
        pointText: 'Phương pháp khắc phục: 1. Sử dụng JOIN FETCH trong JPQL/HQL để kéo dữ liệu trong 1 câu SQL duy nhất; 2. Dùng @EntityGraph hoặc @BatchSize.',
        keywords: ['join fetch', 'entitygraph', 'batchsize', '1 câu sql', 'khắc phục'],
        weight: 35
      }
    ],
    idealAnswer: 'N+1 Query là vấn đề hiệu năng kinh điển khi dùng ORM: Khi ta truy vấn 1 bảng cha (ví dụ lấy 100 User bằng 1 câu SELECT), sau đó trong code ta lặp qua từng User và gọi user.getOrders(). Do cơ chế Lazy Loading, Hibernate sẽ âm thầm bắn thêm 100 câu SELECT riêng biệt xuống Database để lấy danh sách Orders cho từng user. Tổng cộng có 1 + 100 = 101 câu truy vấn, làm nghẽn kết nối HikariCP và chậm API hàng chục lần. Hai giải pháp đặc trị: 1. Dùng "JOIN FETCH" trong câu query JPQL để bảo Hibernate sinh câu lệnh SQL JOIN gom toàn bộ dữ liệu cha và con trong đúng 1 query duy nhất; 2. Sử dụng @EntityGraph của Spring Data JPA hoặc cấu hình @BatchSize(size = 50) để gom query con thành mệnh đề WHERE IN.',
    trapWarning: 'Cạm bẫy: Cẩn thận khi JOIN FETCH trên 2 Collection cùng lúc trong 1 Entity vì sẽ bị dính ngoại lệ MultipleBagFetchException hoặc tạo ra tích Đề-các (Cartesian Product) làm bùng nổ dữ liệu trong RAM.',
    scoringCriteria: 'Nêu định nghĩa 1 query cha + N query con, nguyên nhân Lazy Loading, và 2 giải pháp: JOIN FETCH hoặc @EntityGraph.'
  },
  {
    id: 'db-acid-properties',
    topic: 'Database',
    level: 'Intern',
    question: 'Giải thích 4 thuộc tính ACID của một giao dịch (Transaction) trong cơ sở dữ liệu quan hệ (RDBMS)?',
    contextPrompt: 'Kiểm tra kiến thức nền tảng về tính toàn vẹn dữ liệu trong hệ quản trị cơ sở dữ liệu.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'A - Atomicity (Tính nguyên tử): Tất cả các thao tác trong transaction phải thành công 100%, nếu có 1 lỗi thì rollback toàn bộ ("All or Nothing").',
        keywords: ['atomicity', 'nguyên tử', 'all or nothing', 'rollback', 'toàn bộ'],
        weight: 25
      },
      {
        id: 'p2',
        pointText: 'C - Consistency (Tính nhất quán): Dữ liệu phải luôn thỏa mãn các ràng buộc toàn vẹn (Constraints, Foreign Key, Check) trước và sau transaction.',
        keywords: ['consistency', 'nhất quán', 'ràng buộc', 'toàn vẹn', 'hợp lệ'],
        weight: 25
      },
      {
        id: 'p3',
        pointText: 'I - Isolation (Tính cô lập): Các transaction chạy đồng thời không được can thiệp hay nhìn thấy dữ liệu trung gian của nhau.',
        keywords: ['isolation', 'cô lập', 'đồng thời', 'độc lập', 'không can thiệp'],
        weight: 25
      },
      {
        id: 'p4',
        pointText: 'D - Durability (Tính bền vững): Một khi transaction đã commit thành công, dữ liệu phải được lưu vĩnh viễn trên đĩa (ghi Redo Log) kể cả khi server mất điện đột ngột.',
        keywords: ['durability', 'bền vững', 'vĩnh viễn', 'redo log', 'mất điện', 'ghi đĩa'],
        weight: 25
      }
    ],
    idealAnswer: 'ACID là 4 trụ cột đảm bảo độ tin cậy của giao dịch Database: 1. Atomicity (Tính nguyên tử): Nguyên tắc "Tất cả hoặc không gì cả". Mọi câu lệnh trong giao dịch phải hoàn tất trọn vẹn, nếu có một lỗi xảy ra ở bất kỳ bước nào thì toàn bộ các thay đổi trước đó sẽ bị Rollback về trạng thái ban đầu; 2. Consistency (Tính nhất quán): Dữ liệu chuyển từ trạng thái hợp lệ này sang trạng thái hợp lệ khác, không bao giờ vi phạm các quy tắc ràng buộc (khóa ngoại, unique, check); 3. Isolation (Tính cô lập): Đảm bảo các giao dịch chạy song song độc lập với nhau, không làm rò rỉ dữ liệu chưa hoàn tất; 4. Durability (Tính bền vững): Một khi giao dịch đã báo Commit thành công, dữ liệu được ghi an toàn xuống đĩa cứng (thông qua Write-Ahead Logging / Redo Log) và không bao giờ bị mất kể cả khi máy chủ sập nguồn ngay sau đó.',
    trapWarning: 'Trong hệ thống phân tán (Microservices), ta khó có thể đạt trọn vẹn ACID trên nhiều dịch vụ mà thường chuyển sang mô hình BASE (Basically Available, Soft state, Eventual consistency) và dùng Saga Pattern.',
    scoringCriteria: 'Giải thích đúng và đủ 4 thuộc tính: Atomicity, Consistency, Isolation, Durability kèm ví dụ thực tế.'
  },
  {
    id: 'db-isolation-levels',
    topic: 'Database',
    level: 'Junior',
    question: 'So sánh 4 mức cô lập giao dịch (Transaction Isolation Levels) trong SQL và các hiện tượng bất thường tương ứng?',
    contextPrompt: 'Kiểm tra kiến thức chuyên sâu về đồng quy (Concurrency Control) và cơ chế khóa của RDBMS.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: '4 cấp độ tăng dần: READ UNCOMMITTED -> READ COMMITTED -> REPEATABLE READ -> SERIALIZABLE.',
        keywords: ['read uncommitted', 'read committed', 'repeatable read', 'serializable'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Giải thích 3 hiện tượng: Dirty Read (đọc dữ liệu chưa commit), Non-repeatable Read (cùng 1 dòng bị sửa giá trị), Phantom Read (xuất hiện thêm dòng mới trong phạm vi).',
        keywords: ['dirty read', 'non-repeatable read', 'phantom read', 'hiện tượng'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Đánh đổi: Mức cô lập càng cao thì dữ liệu càng an toàn nhưng hiệu năng và thông lượng (throughput) càng giảm do tranh chấp lock.',
        keywords: ['thông lượng', 'hiệu năng', 'lock', 'tranh chấp', 'đánh đổi'],
        weight: 25
      }
    ],
    idealAnswer: '4 mức cô lập ngăn chặn các hiện tượng bất thường: 1. READ UNCOMMITTED: Cho phép đọc dữ liệu chưa commit của giao dịch khác -> Dính cả Dirty Read, Non-repeatable Read và Phantom Read; 2. READ COMMITTED (Mặc định của Postgres, Oracle): Chỉ đọc dữ liệu đã commit -> Ngăn được Dirty Read, nhưng vẫn có thể dính Non-repeatable Read và Phantom Read; 3. REPEATABLE READ (Mặc định của MySQL InnoDB): Cùng một câu query trong 1 transaction luôn nhìn thấy dữ liệu giống hệt nhau -> Ngăn được Dirty Read và Non-repeatable Read (MySQL dùng MVCC và Next-Key Lock để ngăn luôn Phantom Read); 4. SERIALIZABLE: Thực thi các giao dịch tuần tự tuyệt đối -> Ngăn toàn bộ lỗi nhưng làm giảm mạnh throughput vì khóa bảng trên diện rộng.',
    trapWarning: 'Thực tế sản xuất thường chọn READ COMMITTED kết hợp Optimistic Locking (@Version) ở ứng dụng để đạt hiệu năng cao nhất, ít khi nâng lên SERIALIZABLE.',
    scoringCriteria: 'Nêu được 4 cấp độ từ READ UNCOMMITTED đến SERIALIZABLE và 3 hiện tượng: Dirty Read, Non-repeatable Read, Phantom Read.'
  },
  {
    id: 'db-optimistic-vs-pessimistic-lock',
    topic: 'Database',
    level: 'Fresher',
    question: 'So sánh Khóa Lạc Quan (Optimistic Locking) và Khóa Bi Quan (Pessimistic Locking)? Khi nào nên sử dụng mỗi loại?',
    contextPrompt: 'Kiểm tra kỹ năng giải quyết bài toán xung đột dữ liệu đồng thời (Race Condition) trong hệ thống đặt hàng, chuyển tiền.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Optimistic Locking: Không khóa Database thật; dùng cột version (@Version) để kiểm tra xung đột lúc update; nếu version bị đổi thì ném OptimisticLockException.',
        keywords: ['optimistic', 'lạc quan', '@version', 'không khóa db', 'version'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Pessimistic Locking: Khóa trực tiếp dòng dữ liệu trong Database (SELECT ... FOR UPDATE); chặn các luồng khác không được đọc/ghi cho đến khi transaction kết thúc.',
        keywords: ['pessimistic', 'bi quan', 'select for update', 'khóa dòng', 'chặn luồng'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Ngữ cảnh: Optimistic Lock dùng khi tỷ lệ tranh chấp thấp (đọc nhiều hơn ghi). Pessimistic Lock dùng khi tranh chấp cực cao (Flash Sale trừ kho, số dư tài khoản ngân hàng).',
        keywords: ['tranh chấp thấp', 'tranh chấp cao', 'flash sale', 'ngân hàng', 'khi nào dùng'],
        weight: 30
      }
    ],
    idealAnswer: 'Optimistic Locking (Khóa Lạc Quan) không dùng khóa vật lý dưới DB. Nó thêm một cột version (trong JPA dùng @Version). Khi update, nó chạy câu lệnh: UPDATE items SET stock = stock - 1, version = version + 1 WHERE id = 1 AND version = 5. Nếu có luồng khác đã sửa trước, câu query trả về 0 dòng bị ảnh hưởng và Spring ném OptimisticLockException. Phù hợp cho hệ thống đọc nhiều, ít xung đột ghi. Pessimistic Locking (Khóa Bi Quan) sử dụng câu lệnh SELECT ... FOR UPDATE để khóa cứng bản ghi dưới Database ngay khi đọc, các giao dịch khác phải đứng chờ. Phù hợp cho các nghiệp vụ rủi ro cao và xung đột liên tục như giao dịch tài chính ngân hàng hoặc bán hàng tồn kho Flash Sale.',
    trapWarning: 'Pessimistic Lock tiềm ẩn nguy cơ Deadlock nếu hai luồng khóa chéo các tài khoản theo thứ tự ngẫu nhiên. Luôn phải áp dụng quy tắc sắp xếp khóa nhất quán (Consistent Lock Ordering).',
    scoringCriteria: 'So sánh đúng cơ chế cột @Version vs SELECT FOR UPDATE và ngữ cảnh tranh chấp thấp vs cao.'
  },
  {
    id: 'db-where-vs-having',
    topic: 'Database',
    level: 'Intern',
    question: 'Phân biệt mệnh đề WHERE và HAVING trong SQL? Tại sao không thể dùng hàm tổng hợp (SUM, COUNT) trong mệnh đề WHERE?',
    contextPrompt: 'Kiểm tra hiểu biết về thứ tự thực thi logic của động cơ truy vấn SQL (Logical Query Processing Order).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'WHERE lọc dữ liệu trên từng dòng đơn lẻ TRƯỚC khi thực hiện gom nhóm (GROUP BY). Không thể dùng hàm tổng hợp trong WHERE.',
        keywords: ['where', 'từng dòng', 'trước group by', 'không dùng hàm tổng hợp'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'HAVING lọc dữ liệu trên các nhóm bản ghi SAU khi đã gom nhóm (GROUP BY), và có thể sử dụng trực tiếp các hàm tổng hợp (COUNT, SUM, AVG).',
        keywords: ['having', 'sau group by', 'nhóm', 'hàm tổng hợp', 'count', 'sum'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Thứ tự thực thi logic: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY. Do đó WHERE chạy trước khi hàm tổng hợp được tính toán.',
        keywords: ['thứ tự thực thi', 'from', 'where chạy trước', 'select chạy sau'],
        weight: 20
      }
    ],
    idealAnswer: 'Mệnh đề WHERE dùng để lọc từng dòng dữ liệu đơn lẻ từ bảng TRƯỚC khi dữ liệu được đưa vào gom nhóm. Ngược lại, HAVING dùng để lọc các nhóm bản ghi SAU khi đã thực hiện mệnh đề GROUP BY. Ta không thể dùng hàm tổng hợp (như COUNT, SUM, AVG) trong WHERE vì theo thứ tự thực thi logic của RDBMS: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT. Ở thời điểm mệnh đề WHERE chạy, việc gom nhóm chưa diễn ra nên các giá trị tổng hợp hoàn toàn chưa tồn tại. Muốn lọc theo điều kiện tổng hợp (ví dụ: nhóm khách hàng có tổng chi tiêu SUM(amount) > 10,000,000) bắt buộc phải dùng HAVING.',
    trapWarning: 'Hiểu thứ tự thực thi này cũng giải thích lý do tại sao ta không thể dùng Alias định nghĩa trong SELECT ở mệnh đề WHERE: Vì SELECT được tính toán sau WHERE!',
    scoringCriteria: 'Chỉ ra được WHERE chạy trước GROUP BY trên từng dòng, HAVING chạy sau GROUP BY trên nhóm bản ghi.'
  },
  {
    id: 'db-soft-vs-hard-delete',
    topic: 'Database',
    level: 'Fresher',
    question: 'So sánh Soft Delete (Xóa mềm) và Hard Delete (Xóa cứng)? Cạm bẫy với ràng buộc Unique Constraint khi xóa mềm là gì?',
    contextPrompt: 'Kiểm tra kinh nghiệm thiết kế Schema thực tế, bảo toàn dấu vết kiểm toán (Audit Trail) và xử lý Index xung đột.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Hard Delete xóa vĩnh viễn khỏi ổ cứng (DELETE FROM); nhanh, sạch DB nhưng không thể khôi phục và làm đứt gãy lịch sử hóa đơn.',
        keywords: ['hard delete', 'xóa vĩnh viễn', 'sạch', 'không khôi phục'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Soft Delete cập nhật cờ (is_deleted = true hoặc deleted_at = NOW()); giúp bảo toàn dữ liệu kiểm toán nhưng làm tăng dung lượng và mọi query phải thêm WHERE.',
        keywords: ['soft delete', 'xóa mềm', 'is_deleted', 'deleted_at', 'kiểm toán', 'audit trail'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Cạm bẫy Unique: Khách xóa tài khoản email user@abc.com, sau đó đăng ký lại cùng email sẽ bị lỗi trùng khóa; giải pháp là đánh Unique Composite (email, deleted_at).',
        keywords: ['unique constraint', 'cạm bẫy', 'trùng khóa', 'đăng ký lại', 'composite unique'],
        weight: 35
      }
    ],
    idealAnswer: 'Hard Delete (DELETE) xóa bản ghi vĩnh viễn khỏi ổ đĩa; giải phóng bộ nhớ nhưng không thể khôi phục và làm gãy tính toàn vẹn lịch sử giao dịch. Soft Delete sử dụng cờ (is_deleted = true) hoặc dấu mốc thời gian (deleted_at = TIMESTAMP); giúp dễ dàng khôi phục và giữ trọn vẹn dấu vết kiểm toán (Audit Trail) nhưng làm phình to dung lượng bảng và mọi câu query đều phải gắn thêm điều kiện WHERE is_deleted = false. Cạm bẫy lớn nhất là Unique Constraint: Giả sử cột email có Unique Index; khi user xóa tài khoản rồi một người khác vào đăng ký lại đúng email đó, DB sẽ báo lỗi Duplicate Key! Giải pháp chuẩn là dùng deleted_at và tạo Composite Unique Index (email, deleted_at) với deleted_at mặc định là NULL hoặc 0 khi chưa xóa.',
    trapWarning: 'Trong Spring Data JPA, sử dụng @SQLDelete và @SQLRestriction("is_deleted = false") để tự động hóa việc lọc xóa mềm trên các entity.',
    scoringCriteria: 'Nêu được lợi ích Audit Trail của xóa mềm và cạm bẫy Unique Constraint kèm giải pháp (deleted_at).'
  },
  {
    id: 'db-explain-query',
    topic: 'Database',
    level: 'Junior',
    question: 'Lệnh EXPLAIN trong Database dùng để làm gì? Những thông số báo động đỏ nào cần chú ý để phát hiện câu query chạy chậm?',
    contextPrompt: 'Kiểm tra kỹ năng tối ưu hóa truy vấn SQL thực chiến trên môi trường dữ liệu hàng triệu bản ghi.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'EXPLAIN hiển thị kế hoạch thực thi truy vấn (Execution Plan) do bộ tối ưu hóa (Query Optimizer) của Database tính toán.',
        keywords: ['explain', 'execution plan', 'kế hoạch thực thi', 'optimizer'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Báo động đỏ type = ALL: Nghĩa là Database đang phải quét toàn bộ bảng (Full Table Scan), cần đánh thêm Index ngay.',
        keywords: ['type = all', 'full table scan', 'quét toàn bảng', 'all'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Báo động đỏ ở cột Extra: "Using filesort" (đang phải sắp xếp ngoài RAM/đĩa) và "Using temporary" (tạo bảng tạm), cùng số lượng rows quá lớn.',
        keywords: ['using filesort', 'using temporary', 'rows', 'sắp xếp ngoài', 'bảng tạm'],
        weight: 30
      }
    ],
    idealAnswer: 'Lệnh EXPLAIN hiển thị Kế hoạch thực thi truy vấn (Execution Plan) của Database, cho ta biết bộ tối ưu hóa (Query Optimizer) sẽ dùng chỉ mục nào, quét qua bao nhiêu dòng và nối các bảng ra sao. Ba chỉ số báo động đỏ cần chú ý: 1. Cột "type": Nếu hiển thị "ALL" nghĩa là đang Full Table Scan quét toàn bộ triệu dòng trong bảng, lý tưởng nhất phải là "const", "ref", hoặc "range"; 2. Cột "rows": Ước lượng số lượng dòng dữ liệu mà DB phải đọc lên để lọc kết quả; 3. Cột "Extra": Nếu thấy "Using filesort" nghĩa là DB không dùng được Index để sắp xếp mà phải lôi dữ liệu ra RAM/đĩa để sort; nếu thấy "Using temporary" nghĩa là DB phải tạo bảng tạm để gom nhóm, gây tốn I/O nghiêm trọng.',
    trapWarning: 'Chạy EXPLAIN trên máy local chỉ có 10 bản ghi sẽ không phản ánh đúng kế hoạch chạy thật; luôn cần môi trường test dữ liệu lớn (Staging) để Query Optimizer đưa ra quyết định chuẩn xác.',
    scoringCriteria: 'Chỉ ra được 3 chỉ số then chốt: type = ALL (Full Table Scan), rows quá lớn và Using filesort / Using temporary.'
  },
  {
    id: 'db-primary-vs-unique-foreign',
    topic: 'Database',
    level: 'Intern',
    question: 'Phân biệt Primary Key, Unique Key và Foreign Key trong RDBMS? Tại sao Foreign Key luôn nên được đánh Index?',
    contextPrompt: 'Kiểm tra kiến thức thiết kế cơ sở dữ liệu quan hệ và tối ưu hóa câu lệnh JOIN.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Primary Key xác định duy nhất 1 dòng, không được null, mỗi bảng chỉ có 1 PK (thường là Clustered Index). Unique Key đảm bảo dữ liệu không trùng lặp nhưng cho phép chứa giá trị NULL.',
        keywords: ['primary key', 'khóa chính', 'unique key', 'duy nhất', 'null', '1 pk'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Foreign Key liên kết dữ liệu giữa hai bảng, đảm bảo tính toàn vẹn tham chiếu (Referential Integrity).',
        keywords: ['foreign key', 'khóa ngoại', 'toàn vẹn tham chiếu', 'liên kết bảng'],
        weight: 30
      },
      {
        id: 'p3',
        pointText: 'Tại sao đánh Index cho Foreign Key: Để tăng tốc độ của các câu lệnh JOIN và ngăn chặn việc khóa toàn bảng (Table Lock) khi xóa/sửa ở bảng cha.',
        keywords: ['đánh index', 'join', 'tăng tốc', 'khóa bảng', 'table lock', 'hiệu năng'],
        weight: 35
      }
    ],
    idealAnswer: 'Primary Key (Khóa chính) định danh duy nhất mỗi bản ghi trong bảng, tuyệt đối không được chứa giá trị NULL và mỗi bảng chỉ có đúng 1 Primary Key (mặc định tạo Clustered Index trong InnoDB). Unique Key đảm bảo giá trị trong cột không bị trùng lặp nhưng cho phép chứa giá trị NULL và một bảng có thể có nhiều Unique Key. Foreign Key (Khóa ngoại) trỏ tới Primary Key của bảng khác để đảm bảo tính toàn vẹn tham chiếu. Foreign Key LUÔN nên được đánh Index vì 2 lý do: 1. Tối ưu tốc độ: Hầu như mọi câu lệnh SELECT có JOIN giữa hai bảng đều dựa trên cột Foreign Key; 2. Tránh khóa bảng: Khi xóa hoặc cập nhật dòng ở bảng cha, nếu cột Foreign Key ở bảng con không có index, Database có thể phải khóa toàn bộ bảng con để kiểm tra ràng buộc, gây tắc nghẽn hệ thống.',
    trapWarning: 'Trong MySQL InnoDB, khi tạo Foreign Key nó sẽ tự động tạo Index cho cột đó; nhưng trong nhiều hệ quản trị khác (như PostgreSQL, Oracle), bạn phải tự tạo Index cho Foreign Key một cách thủ công!',
    scoringCriteria: 'Phân biệt rõ PK vs Unique, và giải thích được lý do Foreign Key cần index để tối ưu JOIN và chống khóa bảng.'
  },
  {
    id: 'db-pagination-limit-offset',
    topic: 'Database',
    level: 'Junior',
    question: 'Tại sao câu lệnh phân trang truyền thống "LIMIT 10 OFFSET 1000000" chạy cực kỳ chậm trên bảng dữ liệu lớn? Cách tối ưu bằng Keyset Pagination là gì?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về phân trang dữ liệu quy mô lớn (High Performance Pagination).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Nguyên nhân chậm: OFFSET 1000000 buộc Database phải đọc và duyệt qua toàn bộ 1,000,010 bản ghi từ đĩa rồi vứt bỏ 1,000,000 bản ghi đầu, gây lãng phí I/O khủng khiếp.',
        keywords: ['offset', 'duyệt qua', 'vứt bỏ', '1 triệu dòng', 'chậm', 'lãng phí i/o'],
        weight: 40
      },
      {
        id: 'p2',
        pointText: 'Keyset Pagination (Seek Method): Thay vì dùng OFFSET, sử dụng điều kiện WHERE id > last_seen_id LIMIT 10 dựa trên Index để nhảy thẳng tới vị trí cần lấy.',
        keywords: ['keyset', 'seek method', 'where id >', 'last_seen_id', 'nhảy thẳng', 'chỉ mục'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Kết quả: Tốc độ truy vấn luôn giữ vững O(1) hoặc O(log N) bất kể trang thứ 1 hay trang thứ 1,000,000.',
        keywords: ['o(1)', 'o(log n)', 'ổn định', 'hàng triệu dòng'],
        weight: 20
      }
    ],
    idealAnswer: 'Câu lệnh LIMIT 10 OFFSET 1,000,000 chạy rất chậm vì động cơ Database không thể nhảy cóc thẳng đến dòng thứ 1,000,000. Nó buộc phải đọc tuần tự từ đầu 1,000,010 dòng từ đĩa vào RAM, sau đó vứt bỏ 1,000,000 dòng đầu và chỉ trả về 10 dòng cuối cùng. Khi số trang càng lớn, chi phí đọc đĩa và CPU càng phình to khủng khiếp. Giải pháp tối ưu chuẩn Big Tech là Keyset Pagination (còn gọi là Seek Method hoặc Cursor-based Pagination): Client gửi kèm ID của bản ghi cuối cùng của trang trước (last_seen_id), backend chạy câu lệnh: SELECT * FROM orders WHERE id > last_seen_id ORDER BY id ASC LIMIT 10. Database sẽ tận dụng B+Tree Index để nhảy thẳng tới vị trí bản ghi đó trong 0.5ms bất kể đang ở trang thứ bao nhiêu.',
    trapWarning: 'Nhược điểm của Keyset Pagination là không cho phép người dùng bấm nhảy cóc tới trang số 50 tùy ý, nên thường dùng cho giao diện cuộn vô tận (Infinite Scroll) trên Mobile hoặc Feed xã hội.',
    scoringCriteria: 'Giải thích được chi phí duyệt bỏ dòng của OFFSET lớn và cách tối ưu bằng Keyset Pagination (WHERE id > last_seen_id).'
  },
  {
    id: 'db-left-prefix-rule-composite-index',
    topic: 'Database',
    level: 'Junior',
    question: 'Quy tắc tiền tố bên trái (Leftmost Prefix Rule) trong Composite Index hoạt động như thế nào? Tại sao một câu lệnh WHERE chứa điều kiện khoảng (range condition `>`, `<`) lại làm vô hiệu hóa index ở các cột phía sau?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về cấu trúc vật lý nhiều cột của cây B+Tree và tối ưu câu lệnh truy vấn phức hợp.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Composite Index (a, b, c) được sắp xếp vật lý có thứ tự: Sắp xếp theo a trước; chỉ khi a bằng nhau mới xét thứ tự b; chỉ khi b bằng nhau mới xét c.',
        keywords: ['thứ tự sắp xếp', 'vật lý', 'b+tree', 'composite index', 'tiền tố'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Leftmost Prefix: Truy vấn bắt buộc phải bắt đầu từ cột ngoài cùng bên trái (cột a). Nếu WHERE chỉ chứa b hoặc c mà không có a, Database buộc phải Full Scan.',
        keywords: ['leftmost prefix', 'cột ngoài cùng', 'bắt đầu từ a', 'full scan', 'tiền tố bên trái'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Điều kiện khoảng (Range): Khi gặp a = 1 AND b > 10 AND c = 5, index chỉ dùng được tới cột b. Tại vùng b > 10, giá trị của c không còn liên tục nên index trên c bị mất tác dụng.',
        keywords: ['điều kiện khoảng', 'range condition', 'vô hiệu hóa', 'không liên tục', 'toán tử > <'],
        weight: 30
      }
    ],
    idealAnswer: 'Composite Index (Chỉ mục kết hợp đa cột) trên một tập cột (a, b, c) được B+Tree sắp xếp vật lý theo thứ tự phân cấp nghiêm ngặt: Toàn bộ cây được sắp xếp theo cột a đầu tiên; nếu các giá trị a trùng nhau thì mới xét đến thứ tự cột b; và chỉ khi cả a và b trùng nhau thì mới xét đến c: 1. Quy tắc tiền tố bên trái (Leftmost Prefix Rule): Để tận dụng được cây chỉ mục, câu lệnh WHERE bắt buộc phải chứa cột bắt đầu từ ngoài cùng bên trái (cột a). Các truy vấn tìm theo (a), (a, b), hoặc (a, b, c) sẽ tận dụng tối đa Index. Ngược lại, nếu WHERE chỉ tìm theo (b) hoặc (b, c) mà bỏ qua a, B+Tree không thể xác định nhánh rẽ và buộc phải quét toàn bộ bảng (Full Table Scan); 2. Tác động của điều kiện khoảng (Range Condition): Nếu truy vấn có dạng WHERE a = 1 AND b > 10 AND c = 5: Database dùng index để định vị a = 1, sau đó dùng index để duyệt vùng b > 10. Nhưng vì trong vùng b > 10 có nhiều giá trị b khác nhau (ví dụ b=11, b=12), các giá trị của cột c bên trong các node này không còn được sắp xếp theo một thứ tự duy nhất nữa. Do đó, phần index trên cột c hoàn toàn mất tác dụng định vị B+Tree, Database buộc phải dùng cơ chế lọc bổ sung (Index Condition Pushdown hoặc đọc bộ nhớ).',
    trapWarning: 'Toán tử BETWEEN hoặc dấu so sánh `>`, `<` làm ngắt chuỗi index tiền tố, nhưng toán tử IN (ví dụ `b IN (10, 20)`) trong MySQL 8.0+ vẫn có thể tận dụng index cho cột c tiếp theo nhờ cơ chế Index Skip Scan.',
    scoringCriteria: 'Giải thích được cấu trúc phân cấp vật lý của Composite Index, quy tắc bắt buộc bắt đầu từ cột trái, và cơ chế range condition làm đứt chuỗi sắp xếp.'
  },
  {
    id: 'db-clustered-vs-non-clustered-index',
    topic: 'Database',
    level: 'Fresher',
    question: 'Sự khác biệt giữa Clustered Index (Chỉ mục phân cụm) và Non-Clustered / Secondary Index (Chỉ mục phụ) trong MySQL InnoDB? Hiện tượng Bookmark Lookup (Tra cứu thứ cấp) và kỹ thuật Covering Index là gì?',
    contextPrompt: 'Kiểm tra hiểu biết cấu trúc phân trang trên đĩa của InnoDB engine và kỹ thuật tối ưu giảm Disk I/O.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Clustered Index: Cấu trúc lưu trữ vật lý của bảng; các Node lá của cây B+Tree chứa TOÀN BỘ dữ liệu thực tế của hàng. Mỗi bảng InnoDB chỉ có đúng 1 Clustered Index (thường là Primary Key).',
        keywords: ['clustered index', 'node lá', 'toàn bộ dữ liệu', 'primary key', 'chỉ mục phân cụm'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Secondary Index: Node lá chỉ chứa giá trị cột index kèm con trỏ Khóa chính (Primary Key). Bookmark Lookup: Phải duyệt 2 lần B+Tree (lần 1 tìm PK, lần 2 duyệt Clustered Index để lấy dữ liệu).',
        keywords: ['secondary index', 'non-clustered', 'bookmark lookup', 'duyệt 2 lần', 'tra cứu thứ cấp'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Covering Index: Khi câu SELECT chỉ lấy các cột nằm trọn trong Secondary Index + PK. Database trả về dữ liệu ngay từ node lá của index phụ mà KHÔNG cần Bookmark Lookup.',
        keywords: ['covering index', 'chỉ mục bao phủ', 'không cần bookmark lookup', 'tối ưu i/o'],
        weight: 30
      }
    ],
    idealAnswer: 'Trong MySQL InnoDB: 1. Clustered Index (Chỉ mục phân cụm): Bản thân bảng dữ liệu chính là một cây B+Tree của Clustered Index. Các Node lá (Leaf Nodes) của cây chứa trực tiếp toàn bộ dữ liệu của tất cả các cột trong dòng. Do tính chất vật lý của dữ liệu trên đĩa chỉ có thể xếp theo một thứ tự duy nhất, mỗi bảng chỉ có duy nhất 1 Clustered Index (mặc định là Primary Key; nếu không có PK, InnoDB chọn Unique NOT NULL đầu tiên hoặc tự sinh cột ẩn 6-byte DB_ROW_ID); 2. Non-Clustered / Secondary Index (Chỉ mục phụ): Là các cây B+Tree được tạo thêm khi ta đánh index trên các cột khác (ví dụ email, phone). Node lá của Secondary Index KHÔNG chứa toàn bộ dữ liệu dòng, mà chỉ chứa giá trị của cột index kèm theo giá trị Primary Key tương ứng; 3. Bookmark Lookup (Tra cứu thứ cấp): Khi bạn SELECT * WHERE email = "abc", InnoDB duyệt cây Secondary Index để tìm email và lấy ra Primary Key, sau đó phải dùng Primary Key này để duyệt tiếp cây Clustered Index một lần nữa mới lấy được toàn bộ dữ liệu dòng. Việc nhảy 2 lần cây B+Tree làm tăng số lần Disk I/O; 4. Covering Index (Chỉ mục bao phủ): Nếu câu truy vấn chỉ lấy các cột đã có sẵn trong Secondary Index (ví dụ SELECT id, email FROM users WHERE email = "abc"), InnoDB lấy ngay dữ liệu từ node lá của Secondary Index và trả về luôn cho Client mà không cần Bookmark Lookup, giúp tăng tốc truy vấn gấp nhiều lần.',
    trapWarning: 'Vì Secondary Index luôn lưu kèm Primary Key ở node lá, nên nếu thiết kế Primary Key quá dài (như chuỗi UUID dạng v4 không nén 36 ký tự) sẽ làm phình to dung lượng của TẤT CẢ các Secondary Index trên bảng đó.',
    scoringCriteria: 'Phân biệt rõ node lá của Clustered chứa row data còn Secondary chứa PK, giải thích hiện tượng Bookmark Lookup và kỹ thuật Covering Index.'
  },
  {
    id: 'db-deadlock-detection-prevention',
    topic: 'Database',
    level: 'Junior',
    question: 'Deadlock trong cơ sở dữ liệu quan hệ xảy ra như thế nào? Động cơ Database (như MySQL InnoDB) phát hiện Deadlock bằng cơ chế gì và các chiến lược phòng chống trong code backend?',
    contextPrompt: 'Kiểm tra kỹ năng xử lý tranh chấp đồng thời cao, khóa hàng (Row-level Locking) và bảo vệ giao dịch tài chính.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Bản chất Deadlock: Hai hay nhiều transaction đồng thời nắm giữ khóa trên tài nguyên này và chờ đợi khóa trên tài nguyên mà transaction kia đang nắm giữ tạo thành vòng tròn phụ thuộc.',
        keywords: ['deadlock', 'vòng tròn phụ thuộc', 'chờ đợi khóa', 'tranh chấp tài nguyên', 'khóa hàng'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Phát hiện Deadlock trong InnoDB: Sử dụng đồ thị chờ đợi (Wait-For Graph) và thuật toán Cycle Detection. Khi phát hiện chu trình, nó chọn transaction ít chi phí rollback nhất làm nạn nhân (Victim) và ném lỗi 1213.',
        keywords: ['wait-for graph', 'cycle detection', 'victim', 'nạn nhân', 'rollback', 'lỗi 1213'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Chiến lược phòng chống: Luôn truy cập/cập nhật tài nguyên theo một THỨ TỰ ĐỒNG NHẤT (consistent lock ordering), rút ngắn transaction, và thiết kế cơ chế Retry với Exponential Backoff.',
        keywords: ['thứ tự đồng nhất', 'consistent lock ordering', 'rút ngắn transaction', 'retry', 'exponential backoff'],
        weight: 35
      }
    ],
    idealAnswer: 'Deadlock (Khóa chết) là tình huống hai hay nhiều Transaction rơi vào trạng thái chờ đợi lẫn nhau vô hạn để giải phóng khóa tài nguyên: 1. Kịch bản điển hình: Transaction A khóa dòng 1 và cần khóa tiếp dòng 2; cùng lúc đó Transaction B đang khóa dòng 2 và cần khóa dòng 1. Không ai chịu nhường ai tạo thành chu trình chờ (Circular Wait); 2. Cơ chế phát hiện của InnoDB: InnoDB tích hợp sẵn tiến trình ngầm Deadlock Detector. Nó duy trì một đồ thị có hướng gọi là Wait-For Graph (trong đó đỉnh là Transaction, cạnh là mối quan hệ đang chờ khóa). Động cơ chạy thuật toán duyệt đồ thị phát hiện chu trình (Cycle Detection). Ngay khi phát hiện chu trình Deadlock, nó lập tức chọn Transaction có chi phí rollback nhỏ nhất (dựa trên số dòng INSERT/UPDATE/DELETE ít nhất) làm nạn nhân (Victim), rollback transaction đó và trả về lỗi SQL Error 1213: Deadlock found; 3. Chiến lược phòng chống trong Backend: - Quy tắc thứ tự khóa đồng nhất (Consistent Ordering): Luôn khóa các bản ghi theo thứ tự ID tăng dần (ví dụ khi chuyển tiền giữa User A và User B, luôn sắp xếp khóa tài khoản có ID nhỏ hơn trước rồi mới khóa ID lớn hơn); - Thu nhỏ phạm vi Transaction: Không đặt các lệnh xử lý mạng gọi API chậm chạp bên trong @Transactional; - Cơ chế Retry: Thiết kế tầng Repository/Service tự động bắt lỗi DeadlockException và retry lại sau một khoảng thời gian ngẫu nhiên (Exponential Backoff).',
    trapWarning: 'Nếu tắt Deadlock Detector (`innodb_deadlock_detect=OFF`) để tối ưu hiệu năng ghi cực cao, Database sẽ phải dựa hoàn toàn vào timeout (`innodb_lock_wait_timeout`, mặc định 50s) mới hủy được deadlock, khiến luồng bị treo rất lâu.',
    scoringCriteria: 'Mô tả rõ chu trình chờ khóa, giải thích Wait-For Graph/Victim rollback của InnoDB, và nêu được nguyên tắc Consistent Ordering cùng cơ chế Retry.'
  },
  {
    id: 'db-sharding-vs-partitioning',
    topic: 'Database',
    level: 'Junior',
    question: 'Phân biệt Partitioning (Phân vùng) và Sharding (Phân mảnh) trong cơ sở dữ liệu? Những thách thức kiến trúc lớn nhất khi triển khai Database Sharding là gì?',
    contextPrompt: 'Kiểm tra năng lực thiết kế kiến trúc dữ liệu quy mô hàng chục terabyte đến petabyte (Data Architecture at Scale).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Partitioning (Phân vùng): Chia nhỏ một bảng lớn thành nhiều phân vùng logic/vật lý trên CÙNG MỘT máy chủ database duy nhất, do DB Engine tự động quản lý.',
        keywords: ['partitioning', 'phân vùng', 'cùng máy chủ', 'single instance', 'db engine quản lý'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Sharding (Phân mảnh): Phân tán dữ liệu theo chiều ngang ra NHIỀU máy chủ vật lý độc lập (Cluster nhiều node DB riêng biệt), đòi hỏi Sharding Key và Routing logic.',
        keywords: ['sharding', 'phân mảnh', 'nhiều server', 'cluster', 'sharding key', 'routing'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Thách thức của Sharding: Mất khả năng JOIN liên shard (Cross-shard JOIN), giao dịch phân tán phức tạp (Distributed Transactions 2PC/Saga), và khó khăn khi Re-sharding dữ liệu.',
        keywords: ['cross-shard join', 'distributed transaction', 're-sharding', 'hotspot', 'thách thức'],
        weight: 30
      }
    ],
    idealAnswer: 'Phân biệt giữa Partitioning và Sharding: 1. Partitioning (Phân vùng): Là kỹ thuật chia tách một bảng dữ liệu khổng lồ thành nhiều tập con nhỏ hơn (theo Range, List, Hash) nhưng tất cả các phân vùng này vẫn nằm trên CÙNG MỘT Server/Instance Database duy nhất. Ứng dụng Backend không nhận biết được sự khác biệt vì DB Engine tự động thực hiện Partition Pruning (chỉ quét phân vùng chứa dữ liệu cần tìm). Giới hạn của Partitioning là bị nghẽn bởi giới hạn phần cứng (CPU, RAM, Disk I/O) của 1 máy chủ; 2. Sharding (Phân mảnh ngang): Là kỹ thuật phân tán dữ liệu của bảng sang NHIỀU máy chủ vật lý/Database Instance hoàn toàn tách biệt nhau. Mỗi server chứa một phần dữ liệu (gọi là một Shard). Yêu cầu phải xác định Sharding Key (ví dụ user_id) và cơ chế định tuyến (Hash Sharding hoặc Range Sharding) ở tầng Application hoặc Database Proxy (như ShardingSphere, Vitess); 3. Thách thức kiến trúc khổng lồ của Sharding: - Cross-shard Queries & JOINs: Không thể thực hiện câu lệnh JOIN trực tiếp giữa 2 bảng nằm trên 2 server khác nhau, buộc tầng backend phải query riêng lẻ rồi tự merge kết quả trong RAM; - Distributed Transactions: Việc đảm bảo tính ACID khi ghi dữ liệu đồng thời lên nhiều Shard đòi hỏi các cơ chế tốn kém như Two-Phase Commit (2PC) hoặc Saga Pattern; - Hotspot Data & Re-sharding: Nếu chọn sai Sharding Key, một Shard sẽ bị quá tải trong khi các Shard khác rảnh rỗi. Khi lượng dữ liệu tăng đột biến cần thêm server mới, việc di dời dữ liệu (Re-sharding) mà không gây gián đoạn hệ thống là cực kỳ phức tạp.',
    trapWarning: 'Đừng vội vàng Sharding! Quy tắc kiến trúc là: Luôn tối ưu Index -> Tối ưu Query -> Caching (Redis) -> Tách Read/Write Replicas -> Partitioning trước. Sharding là bước đường cùng khi một node duy nhất không còn khả năng chứa nổi dữ liệu.',
    scoringCriteria: 'Phân biệt rõ cùng 1 server (Partitioning) vs nhiều server độc lập (Sharding), và nêu được 3 thách thức lớn: Cross-shard JOIN, Distributed Transactions, Re-sharding.'
  },
  {
    id: 'db-connection-pool-sizing-hikaricp',
    topic: 'Database',
    level: 'Junior',
    question: 'Công thức vàng để tính toán kích thước Connection Pool (như HikariCP) cho ứng dụng là gì? Tại sao cấu hình pool quá lớn (ví dụ 500 hay 1000 connections) lại khiến ứng dụng chạy chậm hơn và làm sập Database?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về tài nguyên CPU, I/O đĩa, context switching và tối ưu tầng kết nối cơ sở dữ liệu.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Công thức chuẩn (PostgreSQL & HikariCP): connections = ((core_count * 2) + effective_spindle_count). Ví dụ server 4 core dùng SSD thường chỉ cần khoảng 10 kết nối.',
        keywords: ['công thức', 'core_count * 2', 'hikaricp', 'spindle', 'số kết nối tối ưu'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Tác hại của Pool quá lớn: Số lượng CPU Core là hữu hạn. Hàng trăm kết nối đồng thời buộc CPU phải liên tục chuyển ngữ cảnh (Context Switching) làm cạn kiệt CPU và nghẽn Disk I/O.',
        keywords: ['context switching', 'chuyển ngữ cảnh', 'nghẽn cpu', 'quá tải disk i/o', 'thrashing'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Nguyên lý xếp hàng: Giữ Connection Pool nhỏ và để các request xếp hàng đợi (Queue) sẽ cho thông lượng (Throughput) cao hơn và độ trễ (Latency) thấp hơn nhiều so với để DB bị quá tải.',
        keywords: ['hàng đợi', 'queue', 'thông lượng cao hơn', 'độ trễ thấp hơn', 'tối ưu'],
        weight: 30
      }
    ],
    idealAnswer: 'Tính toán kích thước Connection Pool là bài toán tối ưu tài nguyên phần cứng kinh điển: 1. Công thức vàng (do đội ngũ phát triển PostgreSQL và tác giả HikariCP khuyến nghị): `connections = ((core_count * 2) + effective_spindle_count)`. Trong đó core_count là số nhân CPU của máy chủ Database, spindle đại diện cho số ổ đĩa vật lý (với SSD hiện đại, hệ số này thường tính xấp xỉ 1). Ví dụ: Một server Database 8 cores trang bị SSD chỉ cần pool khoảng: 8 * 2 + 1 = 17 kết nối là đạt hiệu suất đỉnh cao nhất!; 2. Tại sao Pool quá lớn lại làm chậm và sập hệ thống?: Nhiều người lầm tưởng tăng pool lên 500 hay 1000 sẽ phục vụ được nhiều khách hàng hơn. Nhưng trên thực tế, máy chủ DB chỉ có 8 CPU core vật lý, nghĩa là tại một thời điểm CHỈ CÓ THỂ thực thi đúng 8 luồng song song. Nếu mở 500 kết nối đồng thời gửi query, CPU sẽ dành phần lớn thời gian để liên tục hoán đổi luồng (Context Switching) và tranh chấp khóa bộ nhớ đệm (Cache Thrashing), cộng thêm đĩa I/O bị nghẽn tắc. Kết quả là CPU DB vọt lên 100%, độ trễ truy vấn tăng từ 5ms lên 5000ms; 3. Triết lý xếp hàng: Giữ pool ở kích thước vừa phải và để các kết nối thừa chờ trong hàng đợi nội bộ (Queue) của HikariCP sẽ giúp Database luôn chạy trong trạng thái CPU tối ưu, truy vấn hoàn thành tức thì và giải phóng kết nối cho người tiếp theo, mang lại Throughput tổng thể cao nhất.',
    trapWarning: 'Nếu bạn có 10 server Microservices cùng kết nối vào 1 Database, thì tổng số kết nối DB nhận được là 10 * pool_size của mỗi app. Do đó pool_size của mỗi service phải được chia nhỏ tương ứng (ví dụ 10 app x 10 connection = 100 kết nối tới DB).',
    scoringCriteria: 'Trình bày đúng công thức HikariCP (core * 2 + spindle), giải thích hiện tượng Context Switching/Disk I/O thrashing khi pool quá lớn, và nguyên lý xếp hàng.'
  },
  {
    id: 'db-mvcc-multi-version-concurrency-control',
    topic: 'Database',
    level: 'Junior',
    question: 'Cơ chế MVCC (Multi-Version Concurrency Control) trong MySQL InnoDB hoạt động như thế nào? Cột ẩn DB_TRX_ID, DB_ROLL_PTR, Undo Log và cấu trúc Read View giải quyết bài toán "đọc không chặn ghi, ghi không chặn đọc" ra sao?',
    contextPrompt: 'Kiểm tra trình độ chuyên sâu về cơ chế Transaction Isolation, snapshot isolation và nguyên lý hoạt động của InnoDB Engine.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Mục đích MVCC: Cho phép thao tác Đọc (SELECT) và Ghi (UPDATE/DELETE) diễn ra đồng thời mà không cần khóa chặn nhau, loại bỏ hoàn toàn Read Lock ở Read Committed và Repeatable Read.',
        keywords: ['mvcc', 'đọc không chặn ghi', 'không cần khóa', 'snapshot isolation', 'nhất quán'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Cột ẩn và Undo Log: Mỗi dòng dữ liệu có 2 cột ẩn: DB_TRX_ID (ID của transaction vừa sửa đổi) và DB_ROLL_PTR (con trỏ trỏ về bản ghi cũ trong Undo Log, tạo thành chuỗi Version Chain).',
        keywords: ['db_trx_id', 'db_roll_ptr', 'undo log', 'version chain', 'cột ẩn'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Read View: Quyết định phiên bản nào trong Undo Log được phép nhìn thấy dựa trên m_ids (danh sách transaction đang chạy), min_trx_id và max_trx_id.',
        keywords: ['read view', 'm_ids', 'min_trx_id', 'max_trx_id', 'khả năng hiển thị', 'visibility'],
        weight: 35
      }
    ],
    idealAnswer: 'MVCC (Điều khiển đồng thời đa phiên bản) là cơ chế nền tảng giúp InnoDB đạt hiệu năng cao: 1. Mục đích: Cho phép câu lệnh SELECT đọc dữ liệu snapshot nhất quán trong quá khứ mà KHÔNG cần đặt Shared Lock (S-Lock), giúp việc đọc không bao giờ chặn việc ghi và việc ghi không bao giờ chặn việc đọc; 2. Cấu trúc vật lý: Mỗi dòng trong bảng InnoDB đều được tự động thêm 2 cột ẩn hệ thống: - `DB_TRX_ID` (6 bytes): Lưu Transaction ID của transaction gần nhất thực hiện INSERT hoặc UPDATE dòng này; - `DB_ROLL_PTR` (7 bytes): Con trỏ Roll Pointer trỏ tới bản ghi trước khi sửa đổi được lưu trữ trong Undo Log. Khi một dòng bị sửa đổi nhiều lần, các bản ghi cũ trong Undo Log liên kết với nhau tạo thành một danh sách liên kết ngược gọi là Chuỗi phiên bản (Version Chain); 3. Cấu trúc Read View và quy tắc hiển thị: Khi một transaction chạy câu lệnh SELECT, nó tạo ra một Read View chứa: `m_ids` (danh sách ID các transaction đang hoạt động chưa commit), `min_trx_id` (ID nhỏ nhất trong m_ids), và `max_trx_id` (ID sẽ cấp cho transaction kế tiếp). Khi đọc một dòng: - Nếu `DB_TRX_ID < min_trx_id`: Transaction tạo ra dòng này đã commit trước khi Read View sinh ra -> Được phép đọc; - Nếu `DB_TRX_ID >= max_trx_id`: Dòng này được tạo ra sau Read View -> Không được đọc; - Nếu `min_trx_id <= DB_TRX_ID < max_trx_id`: Kiểm tra xem nó có nằm trong `m_ids` không. Nếu có (chưa commit) -> Không được đọc, lần ngược theo `DB_ROLL_PTR` về bản ghi cũ trong Undo Log cho tới khi tìm thấy phiên bản hợp lệ!',
    trapWarning: 'Khác biệt giữa 2 cấp độ cô lập: Ở Read Committed, MỖI câu lệnh SELECT đều tạo ra một Read View mới; còn ở Repeatable Read, Read View CHỈ TẠO 1 LẦN DUY NHẤT ở câu lệnh SELECT đầu tiên của Transaction.',
    scoringCriteria: 'Nêu được mục đích đọc không chặn ghi, vai trò của DB_TRX_ID, DB_ROLL_PTR, chuỗi Undo Log Version Chain và thuật toán Read View.'
  },
  {
    id: 'db-redis-data-structures-and-use-cases',
    topic: 'Database',
    level: 'Fresher',
    question: 'Kể tên 5 cấu trúc dữ liệu cốt lõi trong Redis và use cases thực tế trong hệ thống backend cho từng loại? Cấu trúc nào phù hợp nhất để làm Leaderboard và Rate Limiter?',
    contextPrompt: 'Kiểm tra kinh nghiệm thực chiến với In-Memory NoSQL Datastore trong việc xây dựng các tính năng thời gian thực.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: '5 cấu trúc cốt lõi: String (Caching, Token, DistLock), Hash (Object profile người dùng/sản phẩm), List (Queue tác vụ, tin nhắn gần đây), Set (Unique tags, lọc bạn chung), Sorted Set/ZSET (Leaderboard, Rate limiter).',
        keywords: ['string', 'hash', 'list', 'set', 'sorted set', 'zset', '5 cấu trúc'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Leaderboard (Bảng xếp hạng): Dùng ZSET với điểm số (Score) và Member. Dùng lệnh ZADD thêm điểm và ZREVRANGE lấy Top N người điểm cao nhất với độ phức tạp O(log N).',
        keywords: ['leaderboard', 'zset', 'bảng xếp hạng', 'zadd', 'zrevrange', 'o(log n)', 'score'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Rate Limiter: Dùng String với INCR + EXPIRE (Fixed Window) hoặc dùng ZSET với timestamp làm score (Sliding Window Log) để giới hạn số request chính xác theo thời gian.',
        keywords: ['rate limiter', 'incr', 'expire', 'zset timestamp', 'sliding window'],
        weight: 30
      }
    ],
    idealAnswer: 'Redis cung cấp 5 cấu trúc dữ liệu cơ bản với các ứng dụng thực tế phong phú: 1. String: Lưu chuỗi nhị phân tối đa 512MB. Ứng dụng: Caching HTML/JSON, lưu trữ User Session Token, làm biến đếm bộ đếm truy cập (`INCR`), và triển khai Distributed Lock (với `SET NX PX`); 2. Hash: Bảng ánh xạ trường-giá trị (Field-Value). Ứng dụng: Lưu đối tượng người dùng (User Profile: id, name, age) giúp sửa đổi từng trường riêng biệt bằng `HSET` mà không cần serialize lại toàn bộ JSON; 3. List: Danh sách liên kết đôi (Linked List / QuickList). Ứng dụng: Làm hàng đợi tin nhắn đơn giản với `LPUSH` và `RPOP`/`BRPOP`, hoặc lưu danh sách 10 bài viết xem gần nhất; 4. Set: Tập hợp các phần tử không trùng lặp và không có thứ tự. Ứng dụng: Lưu danh sách Tag bài viết, bình chọn duy nhất (chống trùng IP), hoặc tìm bạn chung giữa hai người bằng phép giao tập hợp `SINTER`; 5. Sorted Set (ZSET): Mỗi phần tử gắn với một điểm số thực (Score) và được sắp xếp tự động dựa trên SkipList. Ứng dụng nổi bật nhất: - Leaderboard (Bảng xếp hạng game/doanh thu): Dùng `ZADD leaderboard score user_id` và lấy top 10 bằng `ZREVRANGE leaderboard 0 9 WITHSCORES` trong độ phức tạp cực nhanh O(log N); - Rate Limiter (Giới hạn tần suất): Dùng ZSET theo dõi Sliding Window, dùng timestamp hiện tại làm Score để xóa các request cũ quá hạn (`ZREMRANGEBYSCORE`) và đếm số lượng request còn lại trong cửa sổ thời gian (`ZCARD`).',
    trapWarning: 'Tránh dùng List để làm hàng đợi cho hệ thống tài chính quan trọng vì Redis List không có cơ chế ACK tin nhắn an toàn; hãy dùng Redis Streams (với Consumer Groups) hoặc Kafka.',
    scoringCriteria: 'Kể đúng 5 cấu trúc dữ liệu kèm use cases thực tế, giải thích cơ chế ZSET làm Leaderboard và 2 cách làm Rate Limiter.'
  },
  {
    id: 'db-redis-persistence-rdb-vs-aof',
    topic: 'Database',
    level: 'Junior',
    question: 'So sánh 2 cơ chế bền vững hóa dữ liệu của Redis: RDB (Redis Database) và AOF (Append Only File)? Cơ chế Copy-On-Write của Linux được fork() tận dụng trong RDB như thế nào? Khi nào nên dùng Hybrid Persistence?',
    contextPrompt: 'Kiểm tra kiến thức sâu sắc về độ tin cậy dữ liệu (Durability), tương tác giữa OS Kernel và In-Memory Database.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'RDB (Snapshotting): Lưu bản sao dữ liệu tại một thời điểm thành file nhị phân nén. Ưu điểm: Phục hồi cực nhanh, file gọn. Nhược điểm: Dễ mất dữ liệu phát sinh giữa 2 lần snapshot nếu crash.',
        keywords: ['rdb', 'snapshot', 'bản sao nhị phân', 'phục hồi nhanh', 'mất dữ liệu'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'AOF (Append Only File): Ghi tuần tự mọi lệnh ghi (SET, DEL) vào file log. fsync=everysec chỉ mất tối đa 1s dữ liệu. Nhược điểm: File phình to và tốc độ khởi động lại lâu hơn.',
        keywords: ['aof', 'append only file', 'ghi log tuần tự', 'fsync', 'everysec', 'an toàn hơn'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Linux Copy-On-Write (COW): Lệnh bgsave gọi fork() tạo process con sao chép page table. Chỉ khi process cha sửa RAM, OS mới nhân bản page đó. Hybrid Persistence (Redis 4.0+) kết hợp RDB nén + AOF đuôi.',
        keywords: ['copy-on-write', 'cow', 'fork()', 'tiến trình con', 'hybrid persistence', 'redis 4.0'],
        weight: 30
      }
    ],
    idealAnswer: 'Để dữ liệu trong RAM không bị mất khi mất điện, Redis hỗ trợ 2 cơ chế lưu trữ xuống đĩa: 1. RDB (Snapshot): Định kỳ chụp lại toàn bộ dữ liệu bộ nhớ tại thời điểm đó và lưu thành file nhị phân `dump.rdb` nén. Ưu điểm: Dung lượng file nhỏ, tối ưu cho backup và tốc độ nạp dữ liệu khi khởi động lại (Recovery) cực nhanh. Nhược điểm: Tính bền vững kém; nếu cấu hình 5 phút snapshot 1 lần mà server crash ở phút 4, toàn bộ dữ liệu 4 phút qua sẽ bị mất vĩnh viễn; 2. AOF (Append Only File): Ghi lại toàn bộ các lệnh làm thay đổi dữ liệu (SET, INCR, DEL) vào một file log dạng text tuần tự. Hỗ trợ 3 chế độ `fsync`: `always` (ghi từng lệnh, rất chậm), `everysec` (mặc định - xả xuống đĩa mỗi giây 1 lần, chỉ mất tối đa 1 giây dữ liệu), `no` (để OS tự xả). Ưu điểm: Rất an toàn, ít mất dữ liệu. Nhược điểm: File AOF phình to nhanh chóng (dù có AOF Rewrite) và nạp lại lâu khi khởi động; 3. Cơ chế Copy-On-Write (COW) của Linux trong RDB: Khi chạy lệnh `bgsave`, Redis gọi system call `fork()` để tạo ra một tiến trình con (child process). Nhờ cơ chế COW của Linux Kernel, tiến trình con không sao chép lại toàn bộ RAM mà chia sẻ chung các trang bộ nhớ vật lý với tiến trình cha. Tiến trình con chỉ việc đọc bộ nhớ và ghi ra file rdb. Nếu trong lúc đó tiến trình cha nhận lệnh ghi mới, hệ điều hành mới âm thầm nhân bản trang bộ nhớ cụ thể đó cho cha sửa đổi. Nhờ vậy `bgsave` không làm đứng máy chủ; 4. Hybrid Persistence (Redis 4.0+): Kết hợp tinh hoa của cả hai: Khi AOF Rewrite, nó ghi toàn bộ dữ liệu hiện tại dưới dạng format RDB nén ở phần đầu file, và chỉ ghi các lệnh phát sinh tiếp theo dưới dạng format AOF ở phần đuôi file. Giúp vừa phục hồi siêu tốc vừa an toàn dữ liệu tuyệt đối.',
    trapWarning: 'Nếu máy chủ Redis dùng 80% RAM mà không bật cấu hình Linux Kernel `sysctl vm.overcommit_memory=1`, khi gọi `fork()` hệ điều hành có thể từ chối cấp phát hoặc kích hoạt OOM Killer tiêu diệt ngay tiến trình Redis!',
    scoringCriteria: 'So sánh chính xác ưu/nhược RDB vs AOF, giải thích cơ chế Copy-On-Write khi fork(), và cơ chế Hybrid Persistence.'
  },
  {
    id: 'db-transactional-outbox-pattern',
    topic: 'Database',
    level: 'Junior',
    question: 'Mẫu thiết kế Transactional Outbox Pattern giải quyết bài toán "Dual-Write Problem" giữa Database và Message Broker (như Kafka/RabbitMQ) như thế nào? Cơ chế CDC (Change Data Capture) với Debezium kết hợp ra sao?',
    contextPrompt: 'Kiểm tra kiến thức thiết kế hệ thống phân tán hướng sự kiện (Event-Driven Architecture) đảm bảo tính nhất quán dữ liệu cao.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Vấn đề Dual-Write: Khi cập nhật DB rồi bắn Kafka trong 1 request: Nếu Kafka fail thì DB đã lưu, hoặc DB rollback nhưng Kafka đã gửi tin, gây bất nhất quán dữ liệu nghiêm trọng.',
        keywords: ['dual-write', 'bất nhất quán', 'lỗi kafka', 'rollback db', 'phân tán'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Outbox Pattern: Lưu dữ liệu nghiệp vụ và sự kiện tin nhắn vào bảng `outbox` trong CÙNG MỘT Local Database Transaction ACID (đảm bảo cả hai cùng thành công hoặc cùng hủy).',
        keywords: ['outbox pattern', 'bảng outbox', 'local transaction', 'cùng transaction', 'acid'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'CDC (Debezium): Đọc trực tiếp Database Transaction Log (MySQL Binlog / Postgres WAL) để stream các bản ghi mới từ bảng outbox sang Kafka đảm bảo At-Least-Once và không làm chậm DB.',
        keywords: ['cdc', 'change data capture', 'debezium', 'binlog', 'wal', 'at-least-once'],
        weight: 30
      }
    ],
    idealAnswer: 'Trong kiến trúc Microservices, bài toán Dual-Write xảy ra khi một Service cần cập nhật cơ sở dữ liệu (ví dụ tạo đơn hàng `OrderCreated`) đồng thời bắn sự kiện vào Kafka để Service khác xử lý. Vì Database và Kafka là 2 hệ thống độc lập, ta không thể bọc cả hai vào 1 Transaction: Nếu lưu DB thành công nhưng bắn Kafka bị lỗi mạng, đơn hàng có nhưng không ai xử lý; ngược lại nếu bắn Kafka trước mà DB rollback do trùng dữ liệu, sự kiện ma đã phát tán ra ngoài! Giải pháp Transactional Outbox Pattern: 1. Tạo thêm một bảng trong cùng Database có tên là `outbox` (gồm các cột: id, aggregate_type, payload, status, created_at); 2. Khi có request: Service lưu thông tin đơn hàng vào bảng `orders` VÀ chèn một bản ghi sự kiện vào bảng `outbox` trong CÙNG MỘT Transaction ACID của Database cục bộ. Tính chất nguyên tử (Atomicity) của DB đảm bảo: Hoặc cả đơn hàng lẫn sự kiện outbox cùng được lưu, hoặc không có gì được lưu; 3. Đẩy sự kiện sang Kafka bằng CDC (Change Data Capture) với Debezium: Thay vì cho một tiến trình backend chạy polling SELECT liên tục vào bảng outbox (gây tải DB), ta triển khai Debezium Kafka Connector kết nối trực tiếp vào Transaction Log của DB (MySQL Binlog hoặc PostgreSQL WAL). Ngay khi có lệnh INSERT vào bảng outbox được commit, Debezium đọc log nhị phân và đẩy ngay bản ghi đó lên Kafka Topic tương ứng với độ trễ chỉ vài mili-giây, đảm bảo tin nhắn được phân phối chuẩn At-Least-Once mà không làm chậm DB nghiệp vụ.',
    trapWarning: 'Vì Debezium đảm bảo chuyển giao At-Least-Once (ít nhất một lần), các Consumer ở đầu nhận bắt buộc phải thiết kế Xử lý Bất biến (Idempotent Consumer) dựa trên ID của sự kiện để tránh xử lý trùng tin nhắn khi có sự cố mạng.',
    scoringCriteria: 'Phân tích được thảm họa bất nhất quán của Dual-Write, giải pháp bảng outbox trong cùng ACID transaction, và cơ chế CDC Debezium đọc Transaction Log.'
  },
  {
    id: 'db-sql-injection-prevention',
    topic: 'Database',
    level: 'Fresher',
    question: 'Bản chất vật lý của lỗ hổng bảo mật SQL Injection là gì? Tại sao PreparedStatement (Parameterized Queries) ngăn chặn triệt để SQL Injection ở cấp độ Abstract Syntax Tree (AST) của trình biên dịch SQL?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về bảo mật cơ sở dữ liệu và cơ chế phân tích cú pháp của SQL Parser.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Bản chất SQL Injection: Dữ liệu người dùng (User Input) bị nối chuỗi trực tiếp làm thay đổi cấu trúc ngữ pháp (Grammar/Syntax) của câu lệnh SQL, biến dữ liệu thành mã thực thi độc hại.',
        keywords: ['sql injection', 'nối chuỗi', 'thay đổi cú pháp', 'biến dữ liệu thành mã', 'or 1=1'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Nguyên lý PreparedStatement: Tách rời 2 giai đoạn: 1. SQL Parser phân tích cú pháp và xây dựng cây Abstract Syntax Tree (AST) cùng kế hoạch thực thi trước với dấu hỏi chấm ?; 2. Nạp dữ liệu vào sau.',
        keywords: ['preparedstatement', 'tách rời', 'ast', 'abstract syntax tree', 'phân tích cú pháp', 'dấu chấm hỏi ?'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Ngăn chặn triệt để: Giá trị tham số được truyền qua giao thức nhị phân và chỉ được đối xử như giá trị chuỗi thuần túy (Literal Value), hoàn toàn không thể làm thay đổi cây cú pháp AST đã biên dịch.',
        keywords: ['literal value', 'giá trị thuần túy', 'không đổi cây cú pháp', 'triệt để'],
        weight: 30
      }
    ],
    idealAnswer: 'SQL Injection là một trong những lỗ hổng bảo mật nguy hiểm nhất trong lịch sử: 1. Bản chất vật lý: Xảy ra khi lập trình viên dùng phép nối chuỗi (String Concatenation) để tạo câu lệnh SQL từ dữ liệu người dùng nhập vào. Khi kẻ tấn công nhập các ký tự điều khiển cú pháp (như dấu nháy đơn \'\', dấu chấm phẩy \';\', hoặc mệnh đề OR \'1\'=\'1\'), chuỗi này hòa lẫn vào câu lệnh gốc khiến trình biên dịch SQL hiểu lầm rằng đó là các từ khóa chỉ thị lệnh, làm biến đổi hoàn toàn logic truy vấn ban đầu; 2. Tại sao PreparedStatement ngăn chặn triệt để?: PreparedStatement (Parameterized Query) hoạt động theo nguyên lý tách rời việc biên dịch cấu trúc lệnh và nạp dữ liệu thành 2 giai đoạn độc lập: - Giai đoạn 1 (Compile & Parse): Ứng dụng gửi khung sườn câu lệnh chứa các dấu hỏi chấm giữ chỗ (Placeholders ?) xuống Database Engine (ví dụ: SELECT * FROM users WHERE username = ? AND password = ?). Trình phân tích cú pháp SQL (SQL Parser) sẽ phân tích từ vựng, kiểm tra ngữ pháp và dựng nên Cây cú pháp trừu tượng (Abstract Syntax Tree - AST) cùng Kế hoạch thực thi (Execution Plan) cố định sẵn; - Giai đoạn 2 (Bind Parameters): Dữ liệu của người dùng được gửi xuống qua giao thức nhị phân và gán vào các node lá của cây AST. Tại thời điểm này, dù người dùng có nhập chuỗi hiểm độc như admin\' OR 1=1 --, Database Engine chỉ đối xử với toàn bộ đoạn text đó như một Giá trị Hằng số thuần túy (Literal Value) để so khớp chuỗi. Nó tuyệt đối không thể phá vỡ hay thêm bớt bất kỳ node điều kiện nào trên cây cú pháp AST đã được đóng băng!',
    trapWarning: 'PreparedStatement chỉ bảo vệ cho các vị trí Giá trị dữ liệu (Values). Bạn KHÔNG THỂ dùng placeholder `?` cho Tên bảng (Table Name), Tên cột (Column Name) hoặc mệnh đề `ORDER BY ASC/DESC`. Nếu nối chuỗi ở những vị trí này, bạn vẫn bị SQL Injection như thường!',
    scoringCriteria: 'Phân tích bản chất biến dữ liệu thành mã lệnh, giải thích cơ chế phân tách 2 giai đoạn và cấu trúc cây AST cố định của PreparedStatement.'
  },

  // ==========================================
  // CHỦ ĐỀ 4: NETWORK (20 CÂU)
  // ==========================================
  {
    id: 'net-tcp-three-way-handshake',
    topic: 'Network',
    level: 'Intern',
    question: 'Quá trình bắt tay 3 bước (TCP 3-Way Handshake) diễn ra như thế nào? Mục đích của nó là gì?',
    contextPrompt: 'Kiểm tra kiến thức nền tảng về giao thức truyền vận đáng tin cậy ở tầng Transport Layer.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Mục đích: Thiết lập kết nối tin cậy giữa Client và Server, đồng bộ hóa số thứ tự gói tin (Sequence Number) ban đầu trước khi truyền dữ liệu.',
        keywords: ['thiết lập kết nối', 'tin cậy', 'đồng bộ sequence number', 'seq', 'mục đích'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Bước 1: Client gửi cờ SYN kèm số Seq_A ngẫu nhiên. Bước 2: Server phản hồi SYN-ACK kèm số Seq_B và ACK = Seq_A + 1.',
        keywords: ['bước 1', 'syn', 'bước 2', 'syn-ack', 'ack = seq + 1'],
        weight: 40
      },
      {
        id: 'p3',
        pointText: 'Bước 3: Client gửi ACK phản hồi (ACK = Seq_B + 1). Kết nối chính thức chuyển sang trạng thái ESTABLISHED.',
        keywords: ['bước 3', 'ack', 'established', 'kết nối thành công'],
        weight: 30
      }
    ],
    idealAnswer: 'Quá trình bắt tay 3 bước (Three-way Handshake) của giao thức TCP nhằm thiết lập một kết nối tin cậy và đồng bộ hóa số thứ tự tuần tự (Sequence Number) giữa hai đầu: 1. Bước 1 (SYN): Client gửi một gói tin có cờ SYN = 1 kèm một số thứ tự ngẫu nhiên ban đầu (Seq = X) để yêu cầu kết nối; 2. Bước 2 (SYN-ACK): Server nhận được, đồng ý kết nối bằng cách gửi lại gói tin có cả cờ SYN = 1 và ACK = 1, mang số thứ tự riêng của Server (Seq = Y) và xác nhận gói tin của Client bằng Ack = X + 1; 3. Bước 3 (ACK): Client gửi lại gói tin có cờ ACK = 1 xác nhận đã nhận được Seq của server bằng Ack = Y + 1. Sau bước này, kết nối chuyển sang trạng thái ESTABLISHED và hai bên bắt đầu truyền dữ liệu an toàn.',
    trapWarning: 'Phỏng vấn viên sẽ hỏi thêm: "Tại sao phải là 3 bước mà không phải 2 bước?" ➔ 2 bước không đủ để Client xác nhận rằng Server đã nhận được gói ACK của mình, dễ dẫn đến tạo kết nối ma (Half-open connection) lãng phí tài nguyên Server.',
    scoringCriteria: 'Mô tả chính xác 3 bước SYN -> SYN-ACK -> ACK và mục đích đồng bộ Sequence Number ban đầu.'
  },
  {
    id: 'net-tcp-vs-udp',
    topic: 'Network',
    level: 'Intern',
    question: 'So sánh sự khác nhau giữa giao thức TCP và UDP? Khi nào nên sử dụng mỗi giao thức?',
    contextPrompt: 'Kiểm tra hiểu biết về các giao thức truyền tải dữ liệu phổ biến ở tầng Transport.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'TCP là giao thức hướng kết nối (Connection-oriented), đảm bảo truyền dữ liệu tin cậy 100%, đúng thứ tự, có kiểm soát luồng và chống nghẽn mạng.',
        keywords: ['tcp', 'hướng kết nối', 'tin cậy', 'đúng thứ tự', 'kiểm soát lỗi', 'chậm hơn'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'UDP là giao thức phi kết nối (Connectionless), không đảm bảo độ tin cậy hay thứ tự gói tin, nhưng tốc độ cực nhanh và overhead thấp.',
        keywords: ['udp', 'phi kết nối', 'không đảm bảo', 'nhanh', 'overhead thấp'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Ứng dụng: TCP dùng cho web, email, truyền file, giao dịch (HTTP, HTTPS, SSH, FTP). UDP dùng cho streaming video, voice IP, game online, DNS lookup.',
        keywords: ['http', 'https', 'email', 'streaming', 'video call', 'game', 'dns'],
        weight: 30
      }
    ],
    idealAnswer: 'TCP là giao thức hướng kết nối (Connection-oriented): Bắt buộc phải bắt tay 3 bước trước khi truyền tin; nó đảm bảo dữ liệu tới đích 100% không mất mát (nhờ cơ chế ACK và tự động truyền lại Retransmission), bảo đảm đúng thứ tự các gói tin và có cơ chế kiểm soát tắc nghẽn (Congestion Control). Đổi lại, tốc độ chậm hơn và tốn tài nguyên. UDP là giao thức phi kết nối (Connectionless): Bắn gói tin đi mà không cần bắt tay, không đảm bảo gói tin có tới đích hay đúng thứ tự hay không, nhưng tốc độ cực nhanh và độ trễ siêu thấp. Sử dụng TCP cho các dịch vụ yêu cầu độ chính xác tuyệt đối như HTTP/HTTPS, Web API, chuyển tiền, gửi mail. Dùng UDP cho các tác vụ cần thời gian thực và chấp nhận mất vài frame như Livestream, Game online, Video call (WebRTC) hoặc truy vấn DNS.',
    trapWarning: 'HTTP/3 hiện đại chuyển sang chạy trên giao thức QUIC (dựa trên UDP) để loại bỏ hiện tượng Head-of-Line Blocking của TCP!',
    scoringCriteria: 'Phân biệt rõ tính tin cậy / kiểm soát nghẽn của TCP vs tốc độ cao / độ trễ thấp của UDP kèm ví dụ ứng dụng.'
  },
  {
    id: 'net-http-vs-https',
    topic: 'Network',
    level: 'Intern',
    question: 'HTTP và HTTPS khác nhau như thế nào? Quá trình mã hóa và xác thực trong HTTPS (TLS Handshake) diễn ra ra sao?',
    contextPrompt: 'Kiểm tra kiến thức bảo mật mạng cơ bản, chứng chỉ số SSL/TLS và mã hóa đối xứng / bất đối xứng.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Khác biệt: HTTP truyền văn bản thuần túy (Plaintext, port 80) dễ bị nghe lén. HTTPS là HTTP chạy trên lớp bảo mật SSL/TLS (port 443) được mã hóa toàn diện.',
        keywords: ['http', 'https', 'plaintext', 'mã hóa', 'ssl', 'tls', 'port 443'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'HTTPS đảm bảo 3 yếu tố: Bảo mật (Confidentiality), Toàn vẹn dữ liệu (Integrity), và Xác thực danh tính server (Authentication qua Chứng chỉ SSL/CA).',
        keywords: ['bảo mật', 'toàn vẹn', 'xác thực', 'chứng chỉ', 'certificate', 'ca'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Cơ chế mã hóa: Dùng mã hóa bất đối xứng (RSA/ECC với cặp khóa Public/Private) để trao đổi khóa phiên (Session Key); sau đó dùng mã hóa đối xứng (AES) để truyền dữ liệu.',
        keywords: ['mã hóa bất đối xứng', 'mã hóa đối xứng', 'session key', 'public key', 'private key', 'aes'],
        weight: 30
      }
    ],
    idealAnswer: 'HTTP truyền dữ liệu dưới dạng văn bản thô (Plain text qua port 80), bất kỳ ai nằm trên đường truyền mạng (Wi-Fi công cộng) đều có thể nghe lén và sửa đổi nội dung bằng tấn công Man-in-the-Middle. HTTPS thực chất là HTTP được bọc trong lớp bảo mật SSL/TLS (qua port 443), mang lại 3 lợi ích: 1. Mã hóa dữ liệu; 2. Toàn vẹn thông tin; 3. Xác thực danh tính website thông qua Chứng chỉ số (Certificate) do các tổ chức CA uy tín cấp. Trong quá trình bắt tay TLS: Trình duyệt kiểm tra tính hợp lệ của Certificate; hai bên sử dụng thuật toán mã hóa bất đối xứng (Public/Private Key) để thương lượng an toàn một Khóa Phiên (Symmetric Session Key); sau đó toàn bộ dữ liệu trao đổi tiếp theo sẽ được mã hóa bằng thuật toán đối xứng (như AES-GCM) cực nhanh.',
    trapWarning: 'Tại sao không dùng mã hóa bất đối xứng cho toàn bộ quá trình truyền dữ liệu? ➔ Vì tính toán mã hóa bất đối xứng tiêu tốn CPU gấp hàng trăm lần so với mã hóa đối xứng!',
    scoringCriteria: 'Giải thích được tính bảo mật/toàn vẹn qua TLS Handshake, kết hợp mã hóa bất đối xứng (trao đổi khóa) và đối xứng (truyền dữ liệu).'
  },
  {
    id: 'net-http-status-codes',
    topic: 'Network',
    level: 'Intern',
    question: 'Phân biệt ý nghĩa các dải mã trạng thái HTTP (2xx, 3xx, 4xx, 5xx)? Sự khác biệt giữa 401 Unauthorized và 403 Forbidden là gì?',
    contextPrompt: 'Kiểm tra kỹ năng thiết kế REST API chuẩn mực và nắm vững ngữ nghĩa mã phản hồi HTTP.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Các dải mã: 2xx (Thành công - 200, 201, 204); 3xx (Chuyển hướng - 301, 302); 4xx (Lỗi phía Client - 400, 404); 5xx (Lỗi phía Server - 500, 502, 503).',
        keywords: ['2xx', '3xx', '4xx', '5xx', 'thành công', 'chuyển hướng', 'lỗi client', 'lỗi server'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: '401 Unauthorized: Chưa xác thực danh tính (Unauthenticated) - thiếu token, token sai hoặc token hết hạn (server không biết bạn là ai).',
        keywords: ['401', 'chưa xác thực', 'unauthenticated', 'thiếu token', 'chưa đăng nhập'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: '403 Forbidden: Đã xác thực danh tính nhưng không có quyền truy cập tài nguyên (Access Denied / Unauthorized Role) - ví dụ User thường đòi vào trang Admin.',
        keywords: ['403', 'không có quyền', 'access denied', 'forbidden', 'vai trò', 'role'],
        weight: 30
      }
    ],
    idealAnswer: 'Ý nghĩa các dải mã HTTP: - 2xx (Success): Thành công (200 OK, 201 Created tạo mới, 204 No Content xóa thành công); - 3xx (Redirection): Chuyển hướng tài nguyên (301 Moved Permanently, 302 Temporary); - 4xx (Client Error): Lỗi do phía người dùng gửi request sai (400 Bad Request sai cú pháp, 404 Not Found); - 5xx (Server Error): Lỗi sập phía Backend (500 Internal Error, 502 Bad Gateway, 503 Service Unavailable). Phân biệt 401 vs 403: 401 Unauthorized nghĩa là "Chưa xác thực danh tính" (Unauthenticated) - client chưa đăng nhập hoặc token bị hết hạn; còn 403 Forbidden nghĩa là server đã biết bạn là ai, nhưng tài khoản của bạn "Không có quyền hạn" để truy cập vào tài nguyên đó (ví dụ tài khoản khách đòi gọi API của Admin).',
    trapWarning: '502 Bad Gateway khác 504 Gateway Timeout thế nào? ➔ 502: Proxy nhận được phản hồi lỗi từ server con; 504: Proxy chờ server con xử lý quá lâu mà không nhận được phản hồi (bị timeout).',
    scoringCriteria: 'Phân loại các dải mã 2xx/3xx/4xx/5xx và làm rõ sự khác biệt giữa 401 (chưa xác thực) và 403 (không có quyền).'
  },
  {
    id: 'net-cors-preflight',
    topic: 'Network',
    level: 'Fresher',
    question: 'CORS (Cross-Origin Resource Sharing) là gì? Tại sao trình duyệt lại tự động gửi một request OPTIONS (Preflight Request)?',
    contextPrompt: 'Kiểm tra cơ chế Same-Origin Policy của trình duyệt và cách cấu hình bảo mật web backend.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'CORS là cơ chế bảo mật do TRÌNH DUYỆT THỰC THI dựa trên Same-Origin Policy (SOP), ngăn website độc hại gửi request ngầm sang domain khác lấy cắp dữ liệu.',
        keywords: ['cors', 'trình duyệt', 'same-origin', 'sop', 'bảo mật', 'nguồn gốc'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Preflight Request (OPTIONS) được trình duyệt gửi trước các request không đơn giản (non-simple: có header Authorization, dùng method PUT/DELETE, JSON body) để thăm dò quyền hạn.',
        keywords: ['options', 'preflight', 'thăm dò', 'authorization', 'put delete', 'json'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Backend phải trả về các header: Access-Control-Allow-Origin, Access-Control-Allow-Methods để trình duyệt cho phép tiếp tục gửi request thật.',
        keywords: ['access-control-allow-origin', 'header', 'cho phép', 'phản hồi 200'],
        weight: 30
      }
    ],
    idealAnswer: 'CORS (Cross-Origin Resource Sharing) là một cơ chế bảo mật do chính TRÌNH DUYỆT THỰC THI (không phải do backend), bắt nguồn từ chính sách Same-Origin Policy (SOP) để ngăn các trang web độc hại tự ý gọi API lấy cắp tài nguyên của một domain khác. Khi frontend gọi API tới domain khác và request không phải là "Simple Request" (ví dụ có gắn header Authorization, Content-Type là application/json, hoặc dùng method PUT/DELETE), trình duyệt sẽ tự động gửi trước một request thăm dò gọi là Preflight Request bằng HTTP method OPTIONS. Server backend phải phản hồi HTTP 200 kèm header: Access-Control-Allow-Origin: https://frontend.com. Trình duyệt thấy hợp lệ thì mới chính thức gửi request thật sự tiếp theo.',
    trapWarning: 'Tại sao gọi bằng Postman hoặc curl luôn thành công mà gọi trên web lại dính lỗi CORS màu đỏ? ➔ Vì Postman không phải trình duyệt nên không áp dụng chính sách CORS!',
    scoringCriteria: 'Làm rõ CORS do trình duyệt thực thi dựa trên SOP, và lý do gửi request OPTIONS thăm dò trước request chính.'
  },
  {
    id: 'net-dns-lookup-flow',
    topic: 'Network',
    level: 'Fresher',
    question: 'Điều gì xảy ra từ lúc bạn gõ một địa chỉ website (ví dụ https://google.com) vào trình duyệt cho đến khi trang web hiển thị đầy đủ?',
    contextPrompt: 'Câu hỏi phỏng vấn kinh điển toàn diện kiểm tra kiến trúc mạng từ DNS, TCP, TLS đến HTTP và Rendering.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Phân giải tên miền (DNS Lookup): Trình duyệt tra cứu IP qua Browser Cache -> OS Cache -> Router -> ISP DNS Resolver -> Root/TLD/Authoritative DNS Server.',
        keywords: ['dns', 'ip', 'phân giải tên miền', 'cache', 'dns resolver'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Thiết lập kết nối mạng: Bắt tay 3 bước TCP (TCP 3-way Handshake) và Bắt tay bảo mật TLS Handshake (nếu dùng HTTPS).',
        keywords: ['tcp', 'handshake', 'tls', 'bắt tay', 'kết nối'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Truyền tải và hiển thị: Trình duyệt gửi HTTP GET request -> Server phản hồi HTML/CSS/JS -> Trình duyệt render DOM Tree, CSSOM và vẽ lên màn hình.',
        keywords: ['http get', 'html css js', 'render', 'dom', 'hiển thị'],
        weight: 35
      }
    ],
    idealAnswer: 'Quy trình diễn ra qua 5 bước chính: 1. Phân giải DNS: Trình duyệt kiểm tra bộ nhớ đệm (Browser Cache, OS hosts file); nếu không có sẽ hỏi Recursive DNS Resolver (như 8.8.8.8), resolver hỏi qua Root Server -> TLD Server (.com) -> Authoritative Server để lấy địa chỉ IP đích; 2. Bắt tay TCP: Trình duyệt mở kết nối TCP bằng 3-way Handshake (SYN, SYN-ACK, ACK); 3. Bắt tay TLS: Trao đổi chứng chỉ số và sinh session key để mã hóa dữ liệu HTTPS; 4. Gửi HTTP Request: Trình duyệt gửi GET request kèm headers và cookie; 5. Server phản hồi & Render: Server backend xử lý và trả về HTML, CSS, JavaScript; trình duyệt phân tích mã để xây dựng DOM Tree, CSSOM Tree và render trang web lên màn hình.',
    trapWarning: 'Nếu trang web dùng CDN (Content Delivery Network), DNS sẽ trả về IP của Edge Server gần người dùng nhất về mặt địa lý thay vì IP của máy chủ gốc.',
    scoringCriteria: 'Trình bày tuần tự: Phân giải DNS -> Bắt tay TCP -> Bắt tay TLS -> Gửi HTTP Request -> Render trang web.'
  },
  {
    id: 'net-rest-vs-rpc',
    topic: 'Network',
    level: 'Junior',
    question: 'So sánh kiến trúc RESTful API và gRPC (RPC)? Khi nào nên dùng gRPC thay cho REST?',
    contextPrompt: 'Kiểm tra kiến thức giao tiếp vi dịch vụ (Microservices Communication), giao thức HTTP/1.1 vs HTTP/2, và Serialization.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'REST dựa trên kiến trúc hướng tài nguyên (Resource-oriented), dùng HTTP/1.1, truyền dữ liệu dạng văn bản JSON/XML dễ đọc nhưng kích thước lớn.',
        keywords: ['rest', 'tài nguyên', 'json', 'http/1.1', 'dễ đọc', 'văn bản'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'gRPC dựa trên hướng hành động (Action-oriented / RPC), chạy trên HTTP/2, dùng Protocol Buffers (Protobuf) tuần tự hóa nhị phân cực kỳ nhỏ gọn và nhanh gấp 5-10 lần.',
        keywords: ['grpc', 'protobuf', 'nhị phân', 'http/2', 'nhanh hơn', 'protocol buffers'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Khi nào dùng: REST dùng cho Public API giao tiếp với Web/Mobile client vì tính tương thích cao. gRPC dùng cho giao tiếp nội bộ giữa các microservices cần độ trễ cực thấp.',
        keywords: ['public api', 'mobile web', 'microservices', 'nội bộ', 'độ trễ thấp', 'latency'],
        weight: 30
      }
    ],
    idealAnswer: 'RESTful API là phong cách kiến trúc lấy tài nguyên làm trung tâm (Resource-based: GET/POST /orders), sử dụng HTTP/1.1 và truyền dữ liệu dạng văn bản JSON. Ưu điểm là rất trực quan, con người dễ đọc hiểu, hỗ trợ tốt trên mọi trình duyệt và thiết bị di động. gRPC (do Google phát triển) dựa trên mô hình gọi thủ tục từ xa (RPC), chạy trên nền HTTP/2 (hỗ trợ multiplexing và streaming 2 chiều) và sử dụng Protocol Buffers (Protobuf) để nén dữ liệu dưới dạng nhị phân siêu nhỏ gọn, tốc độ xử lý nhanh hơn JSON gấp 5 đến 10 lần. Nên dùng REST cho các Public API phục vụ Frontend/Mobile; và dùng gRPC cho giao tiếp nội bộ giữa các Microservices (Service-to-Service) cần thông lượng cao và độ trễ thấp.',
    trapWarning: 'Nhược điểm của gRPC là không thể mở trực tiếp trên thanh địa chỉ trình duyệt để xem dữ liệu, và debug qua Wireshark/Postman phức tạp hơn JSON.',
    scoringCriteria: 'So sánh kiến trúc REST (JSON, HTTP/1.1) vs gRPC (Protobuf nhị phân, HTTP/2) và ngữ cảnh Public API vs Nội bộ.'
  },
  {
    id: 'net-osi-vs-tcp-layers',
    topic: 'Network',
    level: 'Intern',
    question: 'Mô hình OSI 7 tầng và mô hình TCP/IP 4 tầng khác nhau như thế nào? Nhiệm vụ chính của tầng Transport và tầng Network là gì?',
    contextPrompt: 'Kiểm tra kiến thức mạng máy tính căn bản theo chuẩn chương trình đại học.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Mô hình OSI có 7 tầng lý thuyết (Physical, Data Link, Network, Transport, Session, Presentation, Application). Mô hình TCP/IP gồm 4 tầng thực tế (Link, Internet, Transport, Application).',
        keywords: ['osi 7 tầng', 'tcp/ip 4 tầng', 'mô hình', 'tầng'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Tầng Network (IP Layer): Chịu trách nhiệm định tuyến gói tin (Routing) giữa các mạng khác nhau dựa trên địa chỉ IP (Logical Addressing).',
        keywords: ['network', 'định tuyến', 'routing', 'địa chỉ ip', 'gói tin'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Tầng Transport (TCP/UDP): Chịu trách nhiệm truyền dữ liệu từ tiến trình tới tiến trình (Process-to-Process) giữa 2 máy tính dựa trên số cổng (Port Number).',
        keywords: ['transport', 'port', 'cổng', 'process-to-process', 'tcp udp', 'tiến trình'],
        weight: 30
      }
    ],
    idealAnswer: 'Mô hình OSI là mô hình tham chiếu lý thuyết gồm 7 tầng (Vật lý, Liên kết dữ liệu, Mạng, Giao vận, Phiên, Trình diễn, Ứng dụng). Mô hình TCP/IP là chuẩn thực tế của mạng Internet gồm 4 tầng (Tầng Liên kết mạng, Tầng Internet, Tầng Giao vận, và Tầng Ứng dụng gom 3 tầng trên của OSI). Hai tầng cốt lõi: 1. Tầng Network (Internet Layer): Chịu trách nhiệm định tuyến (Routing) các gói tin (Packet) đi qua các router mạng trung gian để đến đúng máy đích dựa trên địa chỉ IP; 2. Tầng Transport (Giao vận): Chịu trách nhiệm truyền dữ liệu đầu-cuối giữa các tiến trình cụ thể (Process-to-Process) trên hai máy tính dựa trên số hiệu Port (sử dụng TCP để đảm bảo độ tin cậy hoặc UDP để tối ưu tốc độ).',
    trapWarning: 'IP là địa chỉ định vị máy tính (Host), còn Port là địa chỉ định vị ứng dụng/tiến trình đang chạy trên máy tính đó.',
    scoringCriteria: 'Phân biệt mô hình 7 tầng lý thuyết vs 4 tầng thực tế, và nhiệm vụ của Network (định tuyến IP) vs Transport (cổng Port).'
  },
  {
    id: 'net-get-vs-post-idempotent',
    topic: 'Network',
    level: 'Intern',
    question: 'Sự khác nhau giữa method GET và POST trong HTTP? Tính chất Idempotent (Bảo toàn trạng thái) là gì?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về chuẩn thiết kế RESTful API và an toàn trong giao dịch dữ liệu.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'GET dùng để đọc dữ liệu (an toàn, không thay đổi trạng thái server, dữ liệu nằm trên URL/Query param, có thể cache). POST dùng để gửi dữ liệu tạo mới tài nguyên (dữ liệu nằm trong Body, thay đổi trạng thái server).',
        keywords: ['get đọc dữ liệu', 'post tạo mới', 'body', 'query param', 'cache'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Idempotent (Bảo toàn trạng thái): Một method được gọi 1 lần hay gọi liên tiếp N lần cùng tham số thì trạng thái kết quả trên hệ thống vẫn hoàn toàn giống nhau.',
        keywords: ['idempotent', '1 lần hay n lần', 'kết quả như nhau', 'bảo toàn trạng thái'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Phân loại: GET, PUT, DELETE là Idempotent (gọi DELETE id=5 mười lần thì tài nguyên vẫn ở trạng thái đã xóa). POST KHÔNG PHẢI Idempotent (gọi 10 lần sẽ tạo ra 10 đơn hàng trùng lặp).',
        keywords: ['get put delete idempotent', 'post không idempotent', 'trùng lặp đơn hàng'],
        weight: 30
      }
    ],
    idealAnswer: 'GET dùng để truy xuất dữ liệu từ server: Tham số nằm trên Query String của URL, có thể lưu vào bộ nhớ cache của trình duyệt và không làm thay đổi trạng thái tài nguyên trên server (Safe Method). POST dùng để gửi dữ liệu lên server để tạo mới tài nguyên: Dữ liệu được giấu trong Request Body, không bị giới hạn độ dài như URL và làm thay đổi trạng thái hệ thống. Khái niệm Idempotent (Tính bất biến kết quả): Một thao tác được gọi là Idempotent nếu bạn thực thi nó 1 lần hay gửi lặp lại 100 lần liên tiếp thì trạng thái cuối cùng của tài nguyên trên server vẫn hoàn toàn như nhau. Các method GET, PUT, DELETE là Idempotent (ví dụ: PUT thay thế toàn bộ bản ghi, gọi nhiều lần giá trị vẫn vậy). POST KHÔNG Idempotent vì mỗi lần gửi sẽ sinh thêm 1 bản ghi mới (ví dụ trừ tiền hoặc tạo đơn hàng trùng).',
    trapWarning: 'Vì POST không idempotent nên trong thanh toán ta phải sử dụng Idempotency Key (UUID) để chống khách hàng bấm nút "Thanh toán" hai lần liên tiếp bị trừ tiền đúp.',
    scoringCriteria: 'Phân biệt GET (an toàn, có thể cache) vs POST, và định nghĩa tính chất Idempotent (kết quả bảo toàn khi gọi nhiều lần).'
  },
  {
    id: 'net-connection-read-timeout',
    topic: 'Network',
    level: 'Fresher',
    question: 'Phân biệt Connection Timeout và Read Timeout khi gọi API mạng? Hậu quả gì xảy ra nếu lập trình viên không cấu hình hai thông số này?',
    contextPrompt: 'Kiểm tra kỹ năng phòng thủ hệ thống khi tích hợp API với bên thứ 3 (Payment Gateway, SMS, Shipping).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Connection Timeout: Thời gian tối đa cho phép để thiết lập kết nối TCP bắt tay 3 bước thành công với server đích.',
        keywords: ['connection timeout', 'bắt tay tcp', 'kết nối', 'thiết lập kết nối'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Read Timeout (Socket Timeout): Thời gian tối đa chờ đợi server đích xử lý và trả về gói dữ liệu kế tiếp sau khi kết nối đã mở.',
        keywords: ['read timeout', 'socket timeout', 'chờ nhận dữ liệu', 'xử lý dữ liệu'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Hậu quả nếu không cấu hình: Mặc định trong Java là 0 (chờ vô tận). Nếu đối tác treo mạng, toàn bộ worker thread của Tomcat sẽ bị kẹt lại, làm cạn kiệt luồng và sập toàn bộ hệ thống (Cascading Failure).',
        keywords: ['chờ vô tận', 'treo luồng', 'cạn kiệt thread', 'sập hệ thống', 'cascading failure'],
        weight: 30
      }
    ],
    idealAnswer: 'Khi gọi một API đối tác bằng RestTemplate hoặc HttpClient: 1. Connection Timeout là thời gian tối đa để hoàn thành việc bắt tay 3 bước TCP mở socket tới server đích (nếu IP chết hoặc tường lửa chặn, quá thời gian này sẽ ném ConnectTimeoutException); 2. Read Timeout (Socket Timeout) là thời gian tối đa chờ server đích xử lý và gửi gói tin dữ liệu phản hồi về máy mình sau khi kết nối đã thông (nếu server đối tác bị đơ hoặc query quá chậm, quá hạn sẽ ném SocketTimeoutException). Hậu quả tai hại: Mặc định trong Java timeout bằng 0 (chờ đợi vô tận). Nếu đối tác bên ngoài bị nghẽn mạng, mỗi request từ khách hàng sẽ giữ chặt 1 worker thread của Tomcat. Sau vài phút, toàn bộ 200 threads bị kẹt cứng làm sập trắng trang toàn bộ website của công ty (Cascading Failure).',
    trapWarning: 'Quy tắc vàng khi đi làm: Luôn cấu hình Connection Timeout từ 2-3 giây và Read Timeout từ 5-10 giây cho mọi HTTP Client.',
    scoringCriteria: 'Phân biệt rõ thời gian bắt tay TCP (Connect) vs thời gian chờ nhận dữ liệu (Read) và thảm họa Cascading Failure.'
  },
  {
    id: 'net-tls-13-handshake-internals',
    topic: 'Network',
    level: 'Junior',
    question: 'Quá trình bắt tay TLS 1.3 cải tiến so với TLS 1.2 như thế nào? Tại sao TLS 1.3 giảm độ trễ từ 2-RTT xuống 1-RTT, tính năng 0-RTT (Early Data) hoạt động ra sao và rủi ro Replay Attack là gì?',
    contextPrompt: 'Kiểm tra hiểu biết sâu sắc về mật mã học ứng dụng, bảo mật tầng truyền vận và tối ưu độ trễ mạng.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Cải tiến 1-RTT: TLS 1.2 mất 2 vòng khứ hồi (2-RTT) để đàm phán ciphersuite và trao đổi khóa. TLS 1.3 gộp ClientHello với việc gửi luôn tham số khóa ECDHE (Key Share), hoàn thành trao đổi khóa chỉ trong 1-RTT.',
        keywords: ['1-rtt', '2-rtt', 'tls 1.3', 'ecdhe', 'key share', 'trao đổi khóa'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Loại bỏ mã hóa yếu: TLS 1.3 loại bỏ hoàn toàn RSA key exchange (không có Forward Secrecy), CBC mode, RC4, MD5; chỉ giữ lại thuật toán AEAD (AES-GCM, ChaCha20-Poly1305).',
        keywords: ['loại bỏ rsa', 'forward secrecy', 'aead', 'aes-gcm', 'chacha20-poly1305'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: '0-RTT & Replay Attack: Cho phép Client đã kết nối trước đó gửi kèm Early Data ngay trong ClientHello đầu tiên qua Pre-Shared Key (PSK). Rủi ro: Gói tin 0-RTT có thể bị phát lại (Replay Attack) nên chỉ dùng cho GET idempotent.',
        keywords: ['0-rtt', 'early data', 'psk', 'replay attack', 'phát lại', 'idempotent'],
        weight: 30
      }
    ],
    idealAnswer: 'TLS 1.3 là bước tiến vượt bậc của giao thức bảo mật Transport Layer: 1. Rút ngắn độ trễ từ 2-RTT xuống 1-RTT: Trong TLS 1.2, Client và Server phải mất 2 vòng khứ hồi (2-RTT): vòng 1 để trao đổi danh sách Cipher Suites hỗ trợ, vòng 2 mới thực hiện trao đổi khóa Diffie-Hellman và xác thực chứng chỉ. TLS 1.3 tối ưu hóa triệt để: Trong gói tin ClientHello đầu tiên, Client gửi luôn danh sách các thuật toán hỗ trợ kèm theo giá trị chia sẻ khóa (Key Share parameters theo ECDHE). Server chỉ việc chọn một thuật toán và gửi lại Key Share của mình cùng chứng chỉ đã được mã hóa. Nhờ đó, việc đàm phán bảo mật và trao đổi khóa hoàn tất chỉ sau đúng 1-RTT!; 2. Loại bỏ hoàn toàn các thuật toán mã hóa lỗi thời: TLS 1.3 khai tử cơ chế trao đổi khóa tĩnh RSA (Static RSA không đảm bảo Forward Secrecy - nếu private key của server bị lộ trong tương lai, toàn bộ dữ liệu ghi âm trong quá khứ sẽ bị giải mã sạch), loại bỏ chế độ mã hóa khối CBC (dễ bị tấn công Padding Oracle), chỉ giữ lại các thuật toán mã hóa xác thực AEAD hiện đại (như AES-GCM, ChaCha20-Poly1305); 3. Cơ chế 0-RTT (Early Data): Với các Client đã từng kết nối thành công trước đó (Resumption), Client có thể sử dụng Pre-Shared Key (PSK) để mã hóa dữ liệu ứng dụng (HTTP GET request) và gửi đi ngay lập tức trong gói ClientHello đầu tiên mà không cần chờ bắt tay, đạt độ trễ 0-RTT. Rủi ro Replay Attack: Gói tin 0-RTT không có tính năng chống phát lại (Non-replayable protection). Kẻ tấn công trên đường truyền có thể chụp gói tin đó và gửi lại nhiều lần cho Server. Do đó, 0-RTT chỉ được phép áp dụng cho các truy vấn an toàn và Idempotent (như GET), tuyệt đối cấm dùng cho các thao tác thanh toán hoặc thay đổi dữ liệu (POST/PUT).',
    trapWarning: 'Nhiều người nhầm 0-RTT nghĩa là không tốn mili-giây nào ➔ Sai! 0-RTT là nói về số vòng khứ hồi của handshake TLS, còn việc bắt tay 3 bước TCP ban đầu vẫn phải diễn ra (trừ khi kết hợp với TCP Fast Open hoặc QUIC).',
    scoringCriteria: 'Phân tích được cơ chế giảm 2-RTT xuống 1-RTT nhờ Key Share trong ClientHello, loại bỏ Static RSA để đạt Forward Secrecy, và cơ chế 0-RTT kèm rủi ro Replay Attack.'
  },
  {
    id: 'net-http2-vs-http3-quic',
    topic: 'Network',
    level: 'Junior',
    question: 'Tại sao cơ chế Multiplexing của HTTP/2 vẫn bị hiện tượng nghẽn đầu hàng (Head-of-Line Blocking) ở tầng TCP khi mạng chập chờn? HTTP/3 giải quyết triệt để vấn đề này bằng giao thức QUIC chạy trên UDP như thế nào?',
    contextPrompt: 'Kiểm tra hiểu biết bản chất các tầng mạng TCP/IP và sự tiến hóa của giao thức Web hiện đại.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'HoL Blocking trong HTTP/2: Dù HTTP/2 multiplexing nhiều luồng trên 1 kết nối TCP, nhưng TCP chỉ coi đó là một dòng byte tuần tự duy nhất. Nếu 1 packet TCP bị rớt, OS TCP stack sẽ ngưng toàn bộ các stream khác để chờ truyền lại.',
        keywords: ['head-of-line blocking', 'hol blocking', 'rớt gói tin', 'dòng byte tuần tự', 'treo toàn bộ luồng'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'QUIC trên UDP: HTTP/3 chuyển sang dùng giao thức QUIC chạy trên nền UDP. QUIC tự hiện thực cơ chế truyền tin cậy và kiểm soát tắc nghẽn ở tầng User Space, trong đó mỗi Stream là một luồng độc lập hoàn toàn.',
        keywords: ['quic', 'udp', 'http/3', 'luồng độc lập', 'user space', 'không dùng tcp'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Ưu thế của QUIC: Rớt gói ở Stream A chỉ ảnh hưởng Stream A, các Stream khác vẫn nhận dữ liệu bình thường. Hỗ trợ Connection Migration (chuyển WiFi sang 4G không đứt mạng nhờ Connection ID).',
        keywords: ['không nghẽn liên luồng', 'connection migration', 'connection id', 'chuyển wifi 4g'],
        weight: 30
      }
    ],
    idealAnswer: 'Sự ra đời của HTTP/3 là cuộc cách mạng giải quyết điểm yếu cốt tử của HTTP/2: 1. Tại sao HTTP/2 bị Head-of-Line (HoL) Blocking ở tầng TCP?: HTTP/2 đã xuất sắc giải quyết HoL Blocking ở tầng ứng dụng bằng cách ghép nhiều luồng (Multiplexing) trên cùng một kết nối TCP duy nhất. Tuy nhiên ở tầng Transport, giao thức TCP không hề biết đến khái niệm Stream của HTTP/2; nó chỉ nhìn thấy một chuỗi byte liên tục có thứ tự nghiêm ngặt (In-order byte stream). Khi mạng di động chập chờn và bị rớt (drop) đúng 1 gói tin TCP duy nhất, hệ điều hành bên nhận sẽ giữ lại toàn bộ các gói tin phía sau trong hàng đợi bộ đệm để chờ bên gửi truyền lại gói tin bị mất. Kết quả là TOÀN BỘ các Stream trong HTTP/2 (dù không liên quan gì đến gói bị rớt) đều bị nghẽn cứng lại, khiến hiệu năng HTTP/2 khi mạng yếu còn chậm hơn cả HTTP/1.1; 2. HTTP/3 và QUIC trên nền UDP giải quyết triệt để ra sao?: HTTP/3 từ bỏ hoàn toàn TCP và chuyển sang chạy trên giao thức QUIC (Quick UDP Internet Connections) xây dựng trên nền UDP: - Tách biệt Stream ở tầng Transport: QUIC tự quản lý số thứ tự gói tin cho từng Stream riêng lẻ. Nếu Stream 1 bị mất gói tin, chỉ duy nhất Stream 1 phải dừng lại chờ gửi lại, trong khi Stream 2, Stream 3, Stream 4 vẫn tiếp tục nhận và đẩy dữ liệu lên ứng dụng bình thường, loại bỏ 100% HoL Blocking; - Tích hợp TLS 1.3: QUIC gộp bắt tay truyền vận và bắt tay bảo mật thành một bước duy nhất (1-RTT hoặc 0-RTT); - Connection Migration: QUIC không định danh kết nối bằng bộ tứ IP:Port như TCP mà dùng Connection ID 64-bit ngẫu nhiên. Khi người dùng đang xem video và rời khỏi nhà (chuyển từ mạng WiFi sang 4G khiến IP thay đổi), kết nối QUIC vẫn giữ nguyên mà không cần kết nối lại từ đầu.',
    trapWarning: 'Nhiều người nghĩ UDP không tin cậy nên HTTP/3 sẽ bị mất dữ liệu ➔ Sai hoàn toàn! Bản thân UDP không tin cậy, nhưng tầng QUIC bọc bên trên UDP đã tự cài đặt cơ chế ACK, Sequence Number và Retransmission cực kỳ thông minh.',
    scoringCriteria: 'Chỉ rõ nguyên nhân HoL Blocking của HTTP/2 do TCP coi là single byte stream, giải thích cách QUIC trên UDP cô lập stream độc lập, và tính năng Connection Migration.'
  },
  {
    id: 'net-websocket-vs-sse-vs-polling',
    topic: 'Network',
    level: 'Fresher',
    question: 'So sánh 4 giải pháp truyền dữ liệu thời gian thực: Short Polling, Long Polling, Server-Sent Events (SSE), và WebSocket? Khi nào nên chọn SSE thay vì WebSocket?',
    contextPrompt: 'Kiểm tra kinh nghiệm thực chiến khi thiết kế các tính năng realtime (Chat, Dashboard, Notification, AI Streaming).',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Polling: Short Polling gửi HTTP request định kỳ gây lãng phí băng thông và tải server cao. Long Polling giữ kết nối chờ tới khi có dữ liệu mới phản hồi, đỡ lãng phí hơn nhưng vẫn tốn overhead bắt tay HTTP liên tục.',
        keywords: ['short polling', 'long polling', 'lãng phí băng thông', 'overhead http', 'định kỳ'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'SSE (Server-Sent Events): Giao thức 1 chiều từ Server xuống Client trên nền HTTP chuẩn (text/event-stream), hỗ trợ tự động reconnect, tận dụng HTTP/2 multiplexing và dễ vượt tường lửa.',
        keywords: ['sse', 'server-sent events', '1 chiều', 'text/event-stream', 'http chuẩn', 'tự reconnect'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'WebSocket: Giao thức 2 chiều toàn phần (Full-Duplex) độc lập chạy trên TCP sau khi bắt tay HTTP 101. Chọn SSE cho luồng 1 chiều (AI streaming, thông báo, giá coin); chọn WebSocket cho tương tác 2 chiều liên tục (Chat, Game).',
        keywords: ['websocket', 'full-duplex', '2 chiều', 'khi nào chọn sse', 'chat', 'ai streaming'],
        weight: 35
      }
    ],
    idealAnswer: 'So sánh 4 cơ chế truyền dữ liệu thời gian thực trong Web: 1. Short Polling: Client dùng setInterval gửi HTTP GET định kỳ (ví dụ mỗi 2 giây). Nhược điểm: Băng thông bị lãng phí khủng khiếp cho các request rỗng không có dữ liệu, tạo gánh nặng lớn lên máy chủ; 2. Long Polling: Client gửi HTTP GET, Server giữ kết nối (hang connection) cho đến khi có dữ liệu mới hoặc timeout mới trả response. Sau khi nhận được, Client lập tức mở một request mới. Đỡ tốn tài nguyên hơn Short Polling nhưng vẫn chịu chi phí lớn cho HTTP Header lặp đi lặp lại; 3. Server-Sent Events (SSE): Cơ chế truyền dữ liệu 1 chiều (Unidirectional) từ Server đẩy xuống Client thông qua kết nối HTTP trường cửu với Content-Type: `text/event-stream`. Ưu điểm vượt trội: Hoạt động trên giao thức HTTP chuẩn nên vượt qua mọi tường lửa (Firewall/Proxy) mà không bị chặn, tự động kết nối lại (Auto Reconnect) khi rớt mạng, tích hợp sẵn Event ID để khôi phục tin nhắn bị lỡ, và chạy cực kỳ nhẹ nhàng trên HTTP/2 Multiplexing; 4. WebSocket: Giao thức 2 chiều toàn phần (Full-Duplex) độc lập trên nền TCP. Khởi đầu bằng một HTTP Request có header `Upgrade: websocket`, nếu Server đồng ý sẽ trả về `101 Switching Protocols` và chuyển kênh giao tiếp sang giao thức WebSocket nhị phân siêu nhẹ (chỉ tốn 2-10 bytes overhead mỗi frame). Khi nào chọn SSE thay vì WebSocket?: Khi dữ liệu chỉ cần chảy 1 chiều từ Server xuống Client (như: Hệ thống thông báo Notification, bảng giá chứng khoán cập nhật liên tục, Dashboard theo dõi metrics, hoặc Streaming chữ trả về từ AI ChatGPT/LLM). Dùng SSE đơn giản hơn rất nhiều, không cần quản lý heartbeat socket phức tạp và không gặp vấn đề rớt kết nối qua các corporate proxy.',
    trapWarning: 'Nếu dùng SSE trên HTTP/1.1, trình duyệt bị giới hạn tối đa chỉ mở được 6 kết nối đồng thời trên mỗi domain (khiến mở 6 tab là tab thứ 7 bị treo cứng). Để khắc phục bắt buộc phải bật HTTP/2!',
    scoringCriteria: 'So sánh rõ 4 cơ chế, phân tích ưu điểm kỹ thuật của SSE (reconnect, firewall-friendly), và tiêu chí lựa chọn SSE (1 chiều) vs WebSocket (2 chiều).'
  },
  {
    id: 'net-load-balancer-l4-vs-l7',
    topic: 'Network',
    level: 'Junior',
    question: 'Sự khác biệt cốt lõi giữa Load Balancer tầng 4 (L4) và Load Balancer tầng 7 (L7) trong mô hình OSI là gì? Kịch bản nào nên dùng L4 và khi nào bắt buộc dùng L7?',
    contextPrompt: 'Kiểm tra kiến thức về hạ tầng cân bằng tải, định tuyến lưu lượng và tối ưu kiến trúc mạng.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'L4 Load Balancer: Hoạt động ở tầng Transport (TCP/UDP), định tuyến gói tin dựa trên địa chỉ IP và Cổng (Port), hoàn toàn không phân tích hoặc giải mã nội dung gói tin ứng dụng.',
        keywords: ['l4', 'transport layer', 'tcp/udp', 'ip và port', 'không giải mã nội dung'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'L7 Load Balancer: Hoạt động ở tầng Application (HTTP/HTTPS), phân tích sâu URL path, HTTP Header, Cookie, TLS certificate để định tuyến thông minh (Smart Routing).',
        keywords: ['l7', 'application layer', 'http/https', 'url path', 'cookie', 'tls termination', 'định tuyến thông minh'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Lựa chọn thực tế: Dùng L4 (AWS NLB, IPVS) khi cần thông lượng khổng lồ hàng triệu request/giây, độ trễ cực thấp hoặc giao thức phi HTTP. Dùng L7 (AWS ALB, NGINX) cho Microservices API routing, Canary deployment, Sticky Session.',
        keywords: ['aws nlb', 'aws alb', 'nginx', 'thông lượng cao', 'microservices routing', 'canary'],
        weight: 30
      }
    ],
    idealAnswer: 'Phân biệt Load Balancer L4 và L7 trong kiến trúc mạng: 1. L4 Load Balancer (Tầng Transport): Hoạt động dựa trên thông tin gói tin mạng ở tầng 4 (địa chỉ IP nguồn/đích và Port nguồn/đích theo giao thức TCP/UDP). L4 không hề đọc hay giải mã dữ liệu bên trong gói tin; nó thực hiện cân bằng tải bằng kỹ thuật Network Address Translation (NAT) hoặc Direct Server Return (DSR) ngay ở tầng Kernel. Do không phải tốn CPU để giải mã TLS hay đọc HTTP body, L4 có tốc độ xử lý siêu nhanh, độ trễ cực thấp (micro-seconds) và có thể gánh hàng triệu kết nối đồng thời trên một node; 2. L7 Load Balancer (Tầng Application): Hoạt động ở tầng ứng dụng cao nhất. L7 chấm dứt kết nối TCP của Client (Terminate TCP/TLS), giải mã gói tin và đọc toàn bộ nội dung HTTP Request (URL path, Header, Hostname, Cookie, Request Body). Nhờ hiểu được ngữ nghĩa ứng dụng, L7 có khả năng định tuyến thông minh (Content-based Routing): ví dụ gửi request có URL `/orders` sang Order Service, gửi request từ thiết bị Mobile sang Mobile Service Cluster, kiểm tra JWT xác thực, duy trì Sticky Session qua Cookie, và tích hợp Web Application Firewall (WAF); 3. Lựa chọn thực tế: - Sử dụng L4 (ví dụ AWS Network Load Balancer - NLB, IPVS, HAProxy ở TCP mode): Đặt ở vòng ngoài cùng để tiếp nhận toàn bộ lưu lượng thô khổng lồ, xử lý các kết nối WebSocket/gRPC tải nặng, hoặc cho các ứng dụng không dùng HTTP (như DNS, MQTT, Database Cluster); - Sử dụng L7 (ví dụ AWS Application Load Balancer - ALB, NGINX, Traefik, Kong API Gateway): Đặt ở tầng ứng dụng để làm Ingress Controller cho Kubernetes, phân chia lưu lượng cho Microservices, thực hiện Blue-Green / Canary Deployment và xử lý chứng chỉ SSL/TLS tập trung.',
    trapWarning: 'Vì L7 phải giải mã TLS và phân tích HTTP protocol nên tiêu tốn nhiều CPU và RAM hơn L4 rất nhiều; không nên dùng L7 cho các kết nối UDP streaming game thời gian thực.',
    scoringCriteria: 'Phân biệt rõ L4 (IP/Port, packet forwarding, cực nhanh) vs L7 (Application content, URL/Cookie routing, TLS termination) và nêu đúng kịch bản áp dụng thực tế.'
  },
  {
    id: 'net-mtu-mss-tcp-segmentation',
    topic: 'Network',
    level: 'Junior',
    question: 'Phân biệt MTU (Maximum Transmission Unit) và MSS (Maximum Segment Size)? Hiện tượng IP Fragmentation xảy ra khi nào và kỹ thuật Path MTU Discovery (PMTUD) ngăn ngừa hiện tượng "Black Hole Routers" ra sao?',
    contextPrompt: 'Kiểm tra kiến thức chuyên sâu về tầng Network/Link, phân mảnh gói tin và khắc phục sự cố rớt mạng khó phát hiện.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'MTU là kích thước khung dữ liệu lớn nhất tầng Data Link truyền tải được (Ethernet chuẩn là 1500 bytes). MSS là payload dữ liệu tối đa của TCP Segment (MSS = MTU - IP Header 20B - TCP Header 20B = 1460 bytes).',
        keywords: ['mtu', 'mss', '1500 bytes', '1460 bytes', 'data link', 'tcp segment'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'IP Fragmentation: Xảy ra khi kích thước gói IP lớn hơn MTU của một router trung gian. Router phải chia nhỏ gói tin; nếu mất 1 mảnh nhỏ thì toàn bộ gói phải truyền lại, gây lãng phí lớn.',
        keywords: ['ip fragmentation', 'phân mảnh gói tin', 'router trung gian', 'mất 1 mảnh', 'truyền lại toàn bộ'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'PMTUD & Black Hole Router: Gói TCP bật cờ Don\'t Fragment (DF=1). Nếu router có MTU nhỏ hơn, nó gửi lại ICMP Type 3 Code 4. PMTUD dùng nó để giảm MSS. Nếu tường lửa chặn nhầm ICMP, mạng bị nghẽn vĩnh viễn (Black Hole).',
        keywords: ['pmtud', 'path mtu discovery', 'df=1', 'icmp', 'black hole router', 'nghẽn mạng'],
        weight: 30
      }
    ],
    idealAnswer: 'MTU và MSS là hai khái niệm nền tảng trong truyền nhận dữ liệu qua mạng: 1. MTU (Maximum Transmission Unit): Là dung lượng tối đa của một khung gói tin (Frame/Packet) mà một giao diện tầng Data Link có thể truyền tải mà không cần phân mảnh. Với mạng cáp Ethernet tiêu chuẩn thế giới, MTU là 1500 bytes; 2. MSS (Maximum Segment Size): Là lượng dữ liệu thực tế lớn nhất (Payload) mà một phân đoạn TCP Segment có thể chứa. Công thức tính chuẩn: MSS = MTU - IP Header (tối thiểu 20 bytes) - TCP Header (tối thiểu 20 bytes) = 1500 - 40 = 1460 bytes (với IPv4). Hai bên Client và Server thông báo giá trị MSS của mình cho nhau ngay trong gói tin SYN lúc bắt tay 3 bước TCP; 3. Hiện tượng IP Fragmentation (Phân mảnh IP): Xảy ra khi một gói tin IP đi qua một router trung gian có MTU nhỏ hơn kích thước gói (ví dụ router dùng đường hầm VPN/PPPoE có MTU 1420 bytes). Router buộc phải băm nhỏ gói tin thành 2 mảnh IP riêng biệt. Tác hại: Làm tăng tải CPU router; nguy hiểm nhất là nếu chỉ 1 mảnh nhỏ bị rớt trên đường đi, toàn bộ gói tin gốc sẽ bị coi là hỏng và tầng TCP phải truyền lại từ đầu!; 4. Path MTU Discovery (PMTUD) và Black Hole Routers: Để chống phân mảnh, TCP đặt cờ DF (Don\'t Fragment = 1) trên mọi gói tin IP. Nếu gặp router có MTU nhỏ hơn, router không được băm gói tin mà bắt buộc phải vứt bỏ gói tin đó và gửi về máy nguồn một thông điệp ICMP Type 3, Code 4 ("Fragmentation Needed and DF set") kèm theo MTU của nó. Bên gửi nhận được ICMP sẽ tự động giảm MSS của kết nối xuống. Sự cố Black Hole Router: Rất nhiều quản trị viên hệ thống cấu hình tường lửa (Firewall) chặn toàn bộ gói tin ICMP vì nghĩ là nguy hiểm. Khi đó, thông điệp ICMP thông báo MTU bị chặn lại, bên gửi cứ gửi gói tin lớn mãi mà không biết gói tin đã bị vứt bỏ, trong khi bên nhận không thấy dữ liệu gì. Kết quả là kết nối TCP vẫn mở (ping vẫn thông) nhưng việc truyền tải file hoặc web lớn bị treo cứng vĩnh viễn (Black Hole).',
    trapWarning: 'Khi gặp sự cố kỳ lạ: Ping IP thông, bắt tay TCP thành công, nhưng cứ gọi API có JSON lớn hoặc tải trang web là bị treo vô tận ➔ Thủ phạm số 1 chính là hiện tượng MTU Black Hole do VPN hoặc Firewall chặn ICMP!',
    scoringCriteria: 'Phân biệt rõ công thức MTU (1500) vs MSS (1460), giải thích tác hại của IP Fragmentation, cơ chế PMTUD với cờ DF=1 và hiện tượng Black Hole Router.'
  },
  {
    id: 'net-tcp-congestion-control',
    topic: 'Network',
    level: 'Junior',
    question: 'Bốn giai đoạn kiểm soát tắc nghẽn (TCP Congestion Control) hoạt động như thế nào: Slow Start, Congestion Avoidance, Fast Retransmit, và Fast Recovery? Vai trò của cửa sổ Congestion Window (cwnd) là gì?',
    contextPrompt: 'Kiểm tra trình độ chuyên sâu về cơ chế tự điều tiết băng thông mạng của giao thức TCP.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Cửa sổ cwnd (Congestion Window): Biến do bên gửi tự tính toán để đo lường năng lực mạng, giới hạn lượng dữ liệu tối đa có thể truyền mà chưa cần nhận ACK (FlightSize <= min(cwnd, rwnd)).',
        keywords: ['cwnd', 'congestion window', 'giới hạn dữ liệu', 'chưa cần ack', 'bên gửi tính toán'],
        weight: 30
      },
      {
        id: 'p2',
        pointText: 'Slow Start & Congestion Avoidance: Slow Start bắt đầu với cwnd nhỏ (1-10 MSS), tăng theo hàm mũ (nhân đôi mỗi RTT) cho tới ngưỡng ssthresh. Sau đó sang Congestion Avoidance tăng tuyến tính (+1 MSS mỗi RTT) để dò băng thông.',
        keywords: ['slow start', 'congestion avoidance', 'hàm mũ', 'nhân đôi mỗi rtt', 'ssthresh', 'tuyến tính'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Fast Retransmit & Fast Recovery: Khi nhận 3 Duplicate ACKs, TCP hiểu chỉ có 1 packet bị mất -> Lập tức truyền lại gói tin (Fast Retransmit) và hạ ssthresh xuống 1/2 rồi tiếp tục truyền (Fast Recovery) mà không reset cwnd về 1.',
        keywords: ['fast retransmit', 'fast recovery', '3 duplicate acks', 'không reset về 1', 'ssthresh chia 2'],
        weight: 35
      }
    ],
    idealAnswer: 'Thuật toán TCP Congestion Control (kiểm soát tắc nghẽn) đảm bảo mạng Internet không bị sụp đổ khi hàng triệu thiết bị truyền tải dữ liệu đồng thời: 1. Cửa sổ Congestion Window (cwnd): Khác với Receiver Window (rwnd - do bên nhận gửi về báo dung lượng RAM còn trống), `cwnd` là biến số do chính bên gửi tự duy trì để ước tính sức chứa băng thông của đường truyền mạng. Lượng dữ liệu tối đa được phép bay trên đường truyền là `min(cwnd, rwnd)`; 2. Bốn giai đoạn kiểm soát kinh điển (TCP Reno): - Giai đoạn 1 (Slow Start - Khởi động chậm): Khi bắt đầu kết nối, cwnd khởi tạo nhỏ (thường 10 MSS). Mỗi khi nhận được 1 gói ACK phản hồi, cwnd tăng thêm 1 MSS. Kết quả là sau mỗi vòng RTT (Round-Trip Time), giá trị cwnd tăng gấp đôi theo hàm số mũ (Exponential Growth) để nhanh chóng lấp đầy băng thông; - Giai đoạn 2 (Congestion Avoidance - Tránh tắc nghẽn): Khi cwnd chạm tới ngưỡng `ssthresh` (Slow Start Threshold), tốc độ tăng chuyển từ hàm mũ sang tăng trưởng tuyến tính (Additive Increase): cwnd chỉ tăng thêm đúng 1 MSS sau mỗi RTT. Giúp dò đỉnh băng thông mạng một cách cẩn trọng; - Giai đoạn 3 (Fast Retransmit - Truyền lại nhanh): Khi có 1 gói tin bị mất nhưng các gói sau vẫn đến được đích, bên nhận sẽ liên tục gửi lại các bản tin ACK xác nhận gói tin liền kề trước đó (gọi là Duplicate ACKs). Ngay khi bên gửi nhận được 3 bản tin Duplicate ACK liên tiếp, nó kết luận gói tin cụ thể đó đã bị rơi và LẬP TỨC truyền lại gói tin bị mất đó ngay mà KHÔNG cần đợi bộ đếm thời gian Retransmission Timeout (RTO) hết hạn; - Giai đoạn 4 (Fast Recovery - Khôi phục nhanh): Thay vì đưa cwnd tụt dốc thảm hại về 1 MSS như khi bị timeout, TCP hiểu mạng chỉ bị mất gói cục bộ chứ không phải nghẽn toàn diện: Nó đặt ngưỡng `ssthresh = cwnd / 2`, đặt `cwnd = ssthresh + 3 MSS` và tiếp tục truyền dữ liệu mới ngay trong vùng Congestion Avoidance.',
    trapWarning: 'Nếu bị mất gói nghiêm trọng tới mức hết hạn Retransmission Timeout (RTO) mà không nhận được cả Duplicate ACK, TCP buộc phải rơi vào trường hợp tồi tệ nhất: ssthresh bị cắt đôi và cwnd bị giáng đòn reset thẳng về 1 MSS!',
    scoringCriteria: 'Định nghĩa đúng vai trò của cwnd, phân tích sự chuyển dịch từ hàm mũ (Slow Start) sang tuyến tính (Congestion Avoidance), và cơ chế 3 Duplicate ACKs kích hoạt Fast Retransmit/Fast Recovery.'
  },
  {
    id: 'net-reverse-proxy-forward-proxy',
    topic: 'Network',
    level: 'Fresher',
    question: 'Sự khác biệt cốt lõi giữa Forward Proxy và Reverse Proxy là gì? Nêu các use case thực tế trong doanh nghiệp cho từng loại?',
    contextPrompt: 'Kiểm tra hiểu biết nền tảng về hạ tầng mạng, kiến trúc cổng kết nối và bảo mật hệ thống.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Forward Proxy: Đứng trước Client, thay mặt Client gửi request ra ngoài Internet. Server đích không biết Client thực tế là ai (Client IP bị ẩn).',
        keywords: ['forward proxy', 'đứng trước client', 'đại diện client', 'ẩn danh client', 'ra internet'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Reverse Proxy: Đứng trước cụm Server backend (Origin), tiếp nhận toàn bộ request từ Internet vào. Client hoàn toàn không biết sự tồn tại hay IP của server thực tế.',
        keywords: ['reverse proxy', 'đứng trước server', 'đại diện server', 'ẩn danh backend', 'cụm origin'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Use cases: Forward Proxy dùng trong mạng công ty để kiểm soát truy cập (chặn web độc), bypass tường lửa, VPN; Reverse Proxy (NGINX, HAProxy) dùng để Load Balancing, TLS termination, Caching, chống DDoS.',
        keywords: ['use case', 'kiểm soát nhân viên', 'load balancing', 'tls termination', 'caching', 'chống ddos'],
        weight: 30
      }
    ],
    idealAnswer: 'Phân biệt giữa Forward Proxy và Reverse Proxy dựa trên vị trí và đối tượng được đại diện: 1. Forward Proxy (Proxy xuôi): - Vị trí: Đứng ở biên mạng của Client (phía người dùng); - Vai trò: Đóng vai trò trung gian thay mặt cho người dùng gửi request ra ngoài Internet. Máy chủ trên Internet chỉ nhìn thấy IP của Forward Proxy mà không thể biết IP thực tế của máy Client; - Use cases doanh nghiệp: Mạng nội bộ các tập đoàn hoặc ngân hàng sử dụng Forward Proxy để kiểm soát chính sách truy cập (chặn mạng xã hội, ngăn nhân viên tải file độc hại), lưu cache các file hay tải về để tiết kiệm băng thông ra ngoài, hoặc người dùng cá nhân dùng VPN/Proxy để vượt tường lửa địa lý; 2. Reverse Proxy (Proxy ngược): - Vị trí: Đứng ở biên mạng của các Máy chủ (phía hạ tầng dịch vụ Backend); - Vai trò: Đóng vai trò cửa ngõ tiếp nhận toàn bộ các request từ khách hàng ngoài Internet gửi tới, sau đó điều phối chuyển tiếp các request này vào cụm máy chủ nội bộ (Origin Servers). Khách hàng bên ngoài chỉ nhìn thấy duy nhất IP/Domain của Reverse Proxy mà hoàn toàn mù tịt về số lượng máy chủ, kiến trúc, hay IP thật bên trong; - Use cases doanh nghiệp: Mọi hệ thống Web lớn đều dùng Reverse Proxy (như NGINX, HAProxy, Envoy, Cloudflare): - Cân bằng tải (Load Balancing) chia đều traffic cho các server backend; - Chấm dứt mã hóa SSL/TLS (TLS Termination) giúp giảm tải CPU cho các app server; - Bộ nhớ đệm tài nguyên tĩnh (Static Caching HTML, ảnh, CSS); - Tường lửa chống tấn công từ chối dịch vụ (DDoS Mitigation) và Web Application Firewall (WAF).',
    trapWarning: 'Quy tắc ghi nhớ cực dễ: "Forward Proxy giấu Client khỏi Server, còn Reverse Proxy giấu Server khỏi Client".',
    scoringCriteria: 'Phân biệt rõ đối tượng đại diện (Client vs Server), giải thích luồng giấu IP của từng loại và nêu đủ use cases thực tế.'
  },
  {
    id: 'net-grpc-vs-rest',
    topic: 'Network',
    level: 'Junior',
    question: 'So sánh toàn diện giữa gRPC và RESTful API trong giao tiếp liên Microservices (Inter-service Communication)? Tại sao gRPC cho hiệu năng cao hơn gấp nhiều lần?',
    contextPrompt: 'Kiểm tra kiến thức về kiến trúc Microservices hiện đại, tối ưu IPC (Inter-Process Communication) và tuần tự hóa dữ liệu.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Định dạng dữ liệu: REST dùng JSON dạng text tốn dung lượng và chi phí parse chuỗi CPU cao. gRPC dùng Protocol Buffers (Protobuf) nhị phân siêu nén, serialize/deserialize nhanh hơn 5-10 lần.',
        keywords: ['protobuf', 'json', 'nhị phân', 'text-based', 'tuần tự hóa nhanh hơn', 'tiết kiệm băng thông'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Giao thức truyền tải: REST thường chạy trên HTTP/1.1 (Request-Response tuần tự). gRPC bắt buộc chạy trên HTTP/2 mặc định, tận dụng Multiplexing, Header Compression (HPACK) và 4 kiểu Streaming.',
        keywords: ['http/2', 'http/1.1', 'multiplexing', 'hpack', 'streaming', '2 chiều'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Tính ràng buộc hợp đồng (Contract-first): gRPC bắt buộc định nghĩa schema trong file .proto, tự sinh code đa ngôn ngữ type-safe lúc compile. REST thường loose contract dễ lỗi runtime.',
        keywords: ['.proto', 'contract-first', 'code generation', 'type-safe', 'schema'],
        weight: 30
      }
    ],
    idealAnswer: 'So sánh gRPC và RESTful API trong kiến trúc Microservices: 1. Định dạng dữ liệu (Payload Serialization): RESTful API sử dụng định dạng JSON hoặc XML dạng văn bản thuần túy (Text-based). JSON rất dễ đọc cho con người nhưng tốn nhiều byte trên đường truyền và máy chủ phải tốn chu kỳ CPU đáng kể để phân tích cú pháp chuỗi (String Parsing). Ngược lại, gRPC sử dụng Protocol Buffers (Protobuf) dạng nhị phân siêu nén: Các trường dữ liệu được đánh mã số Tag nhị phân thay vì lưu tên key dạng chuỗi. Kết quả là kích thước payload nhỏ hơn từ 3 đến 10 lần và tốc độ tuần tự hóa (Serialization / Deserialization) nhanh hơn gấp 5 đến 8 lần so với JSON; 2. Tầng giao thức truyền tải: REST chủ yếu chạy trên HTTP/1.1 theo mô hình Request-Response đơn lẻ; nếu muốn gửi 10 request song song, ứng dụng phải mở 10 kết nối TCP riêng biệt (tốn bắt tay 3 bước và RAM). gRPC bắt buộc chạy trên nền HTTP/2: Tận dụng cơ chế ghép luồng (Multiplexing) cho phép hàng ngàn request bay song song trên đúng 1 kết nối TCP duy nhất, nén header bằng HPACK, và hỗ trợ 4 mô hình truyền tin linh hoạt: Unary (1 gửi - 1 nhận), Server Streaming (1 gửi - nhận luồng dữ liệu liên tục), Client Streaming, và Bidirectional Streaming (2 chiều song song); 3. Thiết kế chuẩn Contract-First và An toàn kiểu: gRPC bắt buộc các service phải thống nhất một file hợp đồng `.proto`. Trình biên dịch `protoc` sẽ tự động sinh mã nguồn (Code Generation) cho Java, Go, Python, C#... đảm bảo an toàn kiểu dữ liệu 100% ngay từ lúc biên dịch (Compile-time Type Safety). Trong khi đó REST thường thiết kế tự do, nếu thay đổi kiểu dữ liệu mà không thông báo thì các service khác sẽ bị lỗi NullPointerException lúc runtime; 4. Khi nào dùng loại nào?: gRPC là lựa chọn số 1 cho giao tiếp nội bộ giữa các Microservices (Inter-service East-West traffic) cần tốc độ cực nhanh; RESTful API vẫn là chuẩn mực vàng cho các Public API ra ngoài Internet cho Web Frontend và Mobile App (North-South traffic) vì tính thân thiện với trình duyệt và công cụ kiểm thử.',
    trapWarning: 'gRPC trên trình duyệt (gRPC-Web) vẫn gặp khó khăn vì JavaScript trong browser không thể can thiệp sâu vào các frame nhị phân của HTTP/2, buộc phải qua một Proxy (như Envoy) để chuyển đổi.',
    scoringCriteria: 'So sánh chi tiết 3 khía cạnh: Protobuf nhị phân vs JSON text, HTTP/2 Multiplexing/Streaming vs HTTP/1.1, Contract-first với .proto vs Loose REST, và định hướng sử dụng East-West vs North-South.'
  },
  {
    id: 'net-jwt-structure-security-traps',
    topic: 'Network',
    level: 'Fresher',
    question: 'Cấu trúc 3 phần của JSON Web Token (JWT) là gì? Kể tên 3 lỗ hổng bảo mật chết người liên quan đến JWT (như thuật toán "none", nhầm lẫn khóa HMAC/RSA) và cách thu hồi token trước hạn (Revocation)?',
    contextPrompt: 'Kiểm tra kiến thức thực chiến về Stateless Authentication, cơ chế ký số và bảo mật API.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Cấu trúc 3 phần: Header.Payload.Signature (được mã hóa Base64URL). Header chứa loại token và thuật toán (alg). Payload chứa Claims (sub, exp, roles - chỉ encode, KHÔNG mã hóa). Signature là chữ ký bảo vệ tính toàn vẹn.',
        keywords: ['header', 'payload', 'signature', 'base64url', 'chỉ encode không mã hóa'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'Lỗ hổng bảo mật: 1. Thuật toán "alg: none" bỏ qua kiểm tra chữ ký; 2. Algorithm Confusion (dùng Public Key RSA để verify chữ ký HMAC); 3. Lưu thông tin nhạy cảm (mật khẩu) vào Payload.',
        keywords: ['alg none', 'algorithm confusion', 'nhầm lẫn hmac rsa', 'lộ dữ liệu payload'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Thu hồi Token (Revocation): JWT là stateless nên không thể tự hủy. Giải pháp chuẩn: Cài Access Token TTL ngắn (5-15 phút) + Refresh Token trong Redis/DB; khi logout thì xóa Refresh Token hoặc đưa JWT ID (jti) vào Redis Blacklist.',
        keywords: ['thu hồi token', 'token revocation', 'ttl ngắn', 'refresh token', 'redis blacklist', 'jti'],
        weight: 30
      }
    ],
    idealAnswer: 'JSON Web Token (JWT) là chuẩn mở RFC 7519 phổ biến nhất cho xác thực Stateless: 1. Cấu trúc 3 phần phân tách bởi dấu chấm (`xxxxx.yyyyy.zzzzz`): - Header: Chứa metadata về token gồm kiểu `typ: "JWT"` và thuật toán ký `alg: "HS256"` (hoặc RS256); - Payload: Chứa các thông tin khẳng định (Claims) như `sub` (user ID), `exp` (thời điểm hết hạn), và các quyền `roles`; - Signature: Chữ ký số tạo bằng cách băm `HMACSHA256(base64Url(header) + "." + base64Url(payload), secretKey)` để chống sửa đổi dữ liệu; Cảnh báo cực lớn: Header và Payload CHỈ ĐƯỢC mã hóa Base64URL, nghĩa là bất kỳ ai cũng có thể giải mã để đọc nội dung! Tuyệt đối không được lưu mật khẩu hay số thẻ tín dụng vào Payload; 2. Ba lỗ hổng bảo mật kinh điển: - Lỗ hổng `"alg": "none"`: Tiêu chuẩn JWT cho phép giá trị `none` (không dùng chữ ký). Kẻ tấn công sửa Header thành `"alg": "none"`, sửa Payload thành `role: "ADMIN"`, xóa sạch phần Signature. Nếu thư viện backend không kiểm tra chặt chẽ, hệ thống sẽ tin tưởng token giả mạo này; - Lỗ hổng Algorithm Confusion (Nhầm lẫn thuật toán): Backend được thiết kế dùng bất đối xứng RS256 (Server ký bằng Private Key, Client kiểm tra bằng Public Key). Kẻ tấn công lấy Public Key công khai của server, sau đó dùng thuật toán đối xứng HS256 để ký token bằng chính chuỗi Public Key đó. Khi gửi lên, server vô tình dùng thư viện HMAC để verify với Public Key của mình và xác thực thành công; 3. Chiến lược thu hồi Token trước hạn (Token Revocation): Do tính chất Stateless, một khi JWT đã ký và gửi cho Client thì server không thể thu hồi lại cho tới khi nó tự hết hạn (exp). Cách giải quyết chuẩn Enterprise: Cấp Access Token có thời gian sống cực ngắn (5-15 phút) kết hợp Refresh Token lưu trong Database/Redis. Khi người dùng bấm Đăng xuất hoặc đổi mật khẩu, server xóa Refresh Token khỏi DB. Đối với trường hợp khẩn cấp (tài khoản bị hack), server lưu mã định danh duy nhất của token (`jti`) vào Redis Blacklist với TTL bằng thời gian còn lại của Access Token đó để từ chối ngay lập tức.',
    trapWarning: 'Nhiều lập trình viên nhầm lẫn giữa "Mã hóa" (Encryption) và "Mã hóa ký tự" (Encoding). JWT chỉ là Base64URL Encoding (công khai), ai cũng đọc được, nó chỉ đảm bảo Tính toàn vẹn (Integrity) chứ không bảo vệ Tính bí mật (Confidentiality)!',
    scoringCriteria: 'Phân tích đủ 3 phần của JWT, giải thích lỗ hổng alg:none và Algorithm Confusion, đưa ra giải pháp thu hồi qua short TTL + Refresh Token + Redis Blacklist (jti).'
  },
  {
    id: 'net-cdn-edge-caching',
    topic: 'Network',
    level: 'Junior',
    question: 'Mạng phân phối nội dung CDN (Content Delivery Network) hoạt động như thế nào? Giải thích cơ chế định tuyến Anycast DNS, các HTTP Cache Headers (s-maxage, stale-while-revalidate), và chiến lược Cache Invalidation?',
    contextPrompt: 'Kiểm tra kiến thức tối ưu hiệu năng toàn cầu cho các website quy mô lớn, phân phối tài nguyên tĩnh và video streaming.',
    coreKeyPoints: [
      {
        id: 'p1',
        pointText: 'Nguyên lý CDN & Anycast: Đặt hàng trăm máy chủ Edge PoP phân tán toàn cầu. Anycast DNS công bố cùng 1 địa chỉ IP từ nhiều điểm; giao thức định tuyến BGP tự dẫn đường gói tin tới PoP gần nhất về độ trễ mạng.',
        keywords: ['cdn', 'anycast dns', 'bgp routing', 'edge pop', 'gần nhất về địa lý', 'giảm độ trễ'],
        weight: 35
      },
      {
        id: 'p2',
        pointText: 'HTTP Cache Headers: `s-maxage` áp dụng riêng cho Shared Cache (CDN), ghi đè `max-age` của trình duyệt. `stale-while-revalidate` cho phép CDN trả về data cũ ngay lập tức trong khi âm thầm gọi origin cập nhật ngầm.',
        keywords: ['s-maxage', 'stale-while-revalidate', 'cache-control', 'shared cache', 'cập nhật ngầm'],
        weight: 35
      },
      {
        id: 'p3',
        pointText: 'Cache Invalidation: Xóa cache chủ động qua API Purge (Cloudflare/Fastly) bằng URL hoặc Cache-Tags. Chiến lược tối ưu nhất: Đặt tên file gắn hash (main.a7f9.js) với cache vĩnh viễn (immutable).',
        keywords: ['cache invalidation', 'purge cache', 'cache-tags', 'file hash', 'immutable'],
        weight: 30
      }
    ],
    idealAnswer: 'Mạng phân phối nội dung CDN (Content Delivery Network) là hạ tầng cốt lõi giúp các ứng dụng Web phục vụ hàng trăm triệu người dùng trên toàn cầu với tốc độ cao: 1. Nguyên lý vận hành và Anycast DNS: Thay vì để toàn bộ người dùng từ khắp nơi trên thế giới truy cập về một trung tâm dữ liệu gốc (Origin Server ở Hà Nội hay Singapore), nhà cung cấp CDN (như Cloudflare, AWS CloudFront, Fastly) xây dựng hàng trăm điểm hiện diện Edge Servers (Point of Presence - PoP) rải rác khắp các châu lục. Kỹ thuật Anycast DNS công bố cùng 1 dải địa chỉ IP duy nhất từ tất cả các PoP này; hệ thống định tuyến BGP của mạng Internet toàn cầu sẽ tự động dẫn đường gói tin của người dùng đến Edge Server gần nhất về mặt khoảng cách mạng, giúp giảm thời gian khứ hồi RTT từ hàng trăm mili-giây xuống chỉ còn 5-10ms; 2. Các chỉ thị điều khiển HTTP Cache: - `s-maxage` (Shared max-age): Cho phép phân biệt thời gian cache giữa trình duyệt và CDN. Ví dụ `Cache-Control: public, max-age=60, s-maxage=86400` nghĩa là trình duyệt của người dùng chỉ cache 1 phút, nhưng máy chủ Edge của CDN được phép cache bản ghi đó tới 24 giờ; - `stale-while-revalidate`: Chỉ thị tuyệt vời cho trải nghiệm người dùng: Nếu cache đã hết hạn, CDN vẫn lập tức trả về nội dung cũ (stale response) cho người dùng trong vòng 0ms, đồng thời âm thầm gửi một request ngầm về Origin Server để lấy bản mới nhất nạp lại vào cache; 3. Chiến lược làm mới bộ nhớ đệm (Cache Invalidation): - Phương pháp chủ động Purge: Gửi API Purge tới CDN để xóa các URL cụ thể hoặc dùng `Surrogate-Key` / `Cache-Tags` để xóa đồng loạt các tài nguyên liên quan khi có cập nhật dữ liệu; - Phương pháp tối ưu chuẩn hiện đại (Content Hash / Fingerprinting): Đối với static assets (JS, CSS, Ảnh), các công cụ build (Webpack/Vite) tự động gắn mã băm nội dung vào tên file (ví dụ: `app.4f9a1b.js`). Lúc này ta có thể tự tin cấu hình: `Cache-Control: public, max-age=31536000, immutable` (cache vĩnh viễn 1 năm). Khi có code mới, tên file tự động đổi thành `app.8c2e3d.js`, người dùng tải ngay file mới mà không bao giờ cần tốn công chạy lệnh purge cache!',
    trapWarning: 'Nếu vô tình cache nhầm một API có header `Set-Cookie` chứa Session ID lên CDN (do thiếu chỉ thị `private`), tất cả những người dùng tiếp theo truy cập qua CDN đó sẽ nhận được Session ID của người đầu tiên, dẫn đến thảm họa rò rỉ và chiếm quyền tài khoản hàng loạt!',
    scoringCriteria: 'Giải thích được cơ chế Edge PoP và Anycast DNS, phân biệt rõ tác dụng của s-maxage và stale-while-revalidate, và so sánh 2 chiến lược Invalidation (Purge API vs Content Hash).'
  }
];

