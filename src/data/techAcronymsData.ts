export interface TechAcronym {
  id: string;
  acronym: string;
  fullForm: string;
  pronunciation: string;
  category: 'system-design' | 'database' | 'os-concurrency' | 'networking' | 'java-jvm' | 'security' | 'devops';
  categoryLabel: string;
  meaning: string;
  productionTip: string;
}

export const TECH_ACRONYMS_DATA: TechAcronym[] = [
  {
    "id": "cap",
    "acronym": "CAP",
    "fullForm": "Consistency, Availability, Partition Tolerance",
    "pronunciation": "Đọc là \"Cáp\" /kæp/ hoặc từng chữ \"C-A-P\"",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Định lý CAP của Eric Brewer: Trong một hệ thống lưu trữ phân tán, khi xảy ra phân rã mạng (Network Partition - P), hệ thống chỉ có thể chọn giữa Nhất quán (Consistency - CP) hoặc Sẵn sàng (Availability - AP), không thể có cả hai cùng lúc.",
    "productionTip": "Mạng máy tính không thể tránh khỏi sự cố phân rã (P luôn tồn tại), do đó kỹ sư bắt buộc phải chọn đánh đổi có ý thức giữa CP (RDBMS cluster) hoặc AP (DynamoDB, Cassandra)."
  },
  {
    "id": "pacelc",
    "acronym": "PACELC",
    "fullForm": "If Partition: (Availability vs Consistency) Else: (Latency vs Consistency)",
    "pronunciation": "Đọc là \"Pác-en-xi\" /pækˈel.si/ hoặc \"P-A-C-E-L-C\"",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Mở rộng định lý CAP của Daniel Abadi: Khi mạng bị phân rã (P), chọn A hay C; Còn khi mạng bình thường (Else), hệ thống phải đánh đổi giữa Độ trễ thấp (Latency - L) hay Tính nhất quán (Consistency - C).",
    "productionTip": "MongoDB là PC/EC (ưu tiên C); DynamoDB và Cassandra là PA/EL (ưu tiên Availability khi lỗi mạng và Latency thấp khi bình thường)."
  },
  {
    "id": "base",
    "acronym": "BASE",
    "fullForm": "Basically Available, Soft state, Eventual consistency",
    "pronunciation": "Đọc là \"Bây-s\" /beɪs/ (đồng âm với từ base/nền tảng)",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Triết lý thiết kế đối lập với ACID trong các hệ thống NoSQL phân tán: Chấp nhận hệ thống cơ bản sẵn sàng, trạng thái có thể biến thiên mềm và dữ liệu sẽ hội tụ nhất quán sau một khoảng trễ nhất định.",
    "productionTip": "Đừng cố ép ACID cứng nhắc cho toàn bộ hệ sinh thái microservices; áp dụng BASE cho 80% tính năng đọc/ghi không liên quan trực tiếp đến số dư tài chính."
  },
  {
    "id": "cqrs",
    "acronym": "CQRS",
    "fullForm": "Command Query Responsibility Segregation",
    "pronunciation": "Đọc từng chữ: \"C-Q-R-S\" /ˌsiː.kjuː.ɑːrˈes/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Mẫu kiến trúc tách biệt hoàn toàn mô hình xử lý ghi/thay đổi trạng thái (Command) và mô hình truy vấn đọc dữ liệu (Query) thành hai đường dẫn và database riêng biệt.",
    "productionTip": "Command ghi vào PostgreSQL chuẩn hóa; Query đọc từ ElasticSearch/Redis denormalized được đồng bộ bất đồng bộ qua Kafka."
  },
  {
    "id": "eda",
    "acronym": "EDA",
    "fullForm": "Event-Driven Architecture",
    "pronunciation": "Đọc từng chữ: \"E-D-A\" /ˌiː.diːˈeɪ/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Kiến trúc hướng sự kiện: Các dịch vụ giao tiếp hoàn toàn phi đồng bộ thông qua việc phát sinh (publish) và tiêu thụ (consume) các event qua message broker.",
    "productionTip": "Tách rời (Decouple) dịch vụ hoàn toàn, nhưng đòi hỏi phải có công cụ giám sát distributed tracing tốt để theo dõi luồng event."
  },
  {
    "id": "es",
    "acronym": "ES",
    "fullForm": "Event Sourcing",
    "pronunciation": "Đọc từng chữ: \"E-S\" /ˌiːˈes/ hoặc \"Event Sourcing\"",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Mẫu thiết kế không lưu trữ trạng thái hiện tại mà lưu trữ toàn bộ chuỗi các biến cố thay đổi (Events) đã xảy ra theo thứ tự thời gian vào Append-Only Event Store.",
    "productionTip": "Cho phép tua lại (replay) lịch sử tại bất kỳ thời điểm nào trong quá khứ để tái tạo trạng thái hoặc audit sổ cái tài chính."
  },
  {
    "id": "2pc",
    "acronym": "2PC",
    "fullForm": "Two-Phase Commit Protocol",
    "pronunciation": "Đọc là \"Tu-P-C\" /tuː piː siː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Giao thức đồng thuận phân tán nguyên tử gồm 2 pha: Prepare Phase (hỏi các node sẵn sàng không) và Commit Phase (ra lệnh commit hoặc rollback đồng loạt).",
    "productionTip": "2PC là giao thức chặn (Blocking Protocol): Nếu coordinator bị sập giữa 2 pha, các node thành viên bị khóa tài nguyên vô thời hạn."
  },
  {
    "id": "3pc",
    "acronym": "3PC",
    "fullForm": "Three-Phase Commit Protocol",
    "pronunciation": "Đọc là \"Thri-P-C\" /θriː piː siː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Giao thức mở rộng của 2PC bổ sung thêm trạng thái PreCommit và cơ chế timeout để giảm thiểu tình trạng bế tắc khóa khi coordinator bị lỗi.",
    "productionTip": "Vẫn không thể xử lý hoàn hảo khi mạng bị phân rã, nên các hệ thống phân tán hiện đại (CockroachDB, TiDB, etcd) ưu tiên dùng Raft hoặc Paxos."
  },
  {
    "id": "wal",
    "acronym": "WAL",
    "fullForm": "Write-Ahead Logging",
    "pronunciation": "Đọc là \"Woal\" /wɔːl/ (như từ wall) hoặc \"W-A-L\"",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Kỹ thuật an toàn dữ liệu: Mọi thao tác ghi/sửa dữ liệu bắt buộc phải được ghi tuần tự vào file nhật ký log trên đĩa trước khi cập nhật vào bảng chính trong RAM.",
    "productionTip": "Đảm bảo tính Durability của ACID: Khi máy chủ mất điện đột ngột, database chỉ cần đọc lại WAL để phục hồi nguyên vẹn các transaction đã commit."
  },
  {
    "id": "lsm",
    "acronym": "LSM / LSM-Tree",
    "fullForm": "Log-Structured Merge-Tree",
    "pronunciation": "Đọc là \"L-S-M Tree\" /ˌel.esˈem triː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Cấu trúc dữ liệu lưu trữ chuyên tối ưu cho ghi tuần tự tốc độ cao: Ghi vào RAM (MemTable), flush thành các file bất biến trên đĩa (SSTables) và định kỳ chạy nén (Compaction).",
    "productionTip": "Lõi lưu trữ của RocksDB, Cassandra, ScyllaDB, Bigtable, Kafka và ClickHouse."
  },
  {
    "id": "sstable",
    "acronym": "SSTable",
    "fullForm": "Sorted String Table",
    "pronunciation": "Đọc là \"S-S-Table\" /ˌes.esˈteɪ.bəl/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Định dạng file lưu trữ bất biến trên đĩa của LSM-Tree, trong đó các key-value được sắp xếp theo thứ tự bảng chữ cái tuần tự, kèm theo index thưa và Bloom filter.",
    "productionTip": "Do file là bất biến (immutable), SSTable không bao giờ bị tranh chấp khóa đọc/ghi (lock-free reads) và tận dụng triệt để OS page cache."
  },
  {
    "id": "dlq",
    "acronym": "DLQ",
    "fullForm": "Dead Letter Queue",
    "pronunciation": "Đọc từng chữ: \"D-L-Q\" /ˌdiː.elˈkjuː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Hàng đợi thư chết: Hàng đợi chuyên biệt lưu giữ các message xử lý thất bại sau khi đã retry hết số lần cho phép, cách ly để không làm nghẽn dòng chảy xử lý bình thường.",
    "productionTip": "Luôn phải gắn cảnh báo và công cụ replay runbook cho DLQ để đội ngũ kỹ thuật phân tích nguyên nhân gốc và nạp lại message sau khi vá lỗi."
  },
  {
    "id": "ttl",
    "acronym": "TTL",
    "fullForm": "Time To Live",
    "pronunciation": "Đọc từng chữ: \"T-T-L\" /ˌtiː.tiːˈel/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Thời gian tồn tại tối đa của một bản ghi dữ liệu, khóa cache hoặc gói tin mạng trước khi bị hệ thống tự động xóa bỏ hoặc hủy bỏ.",
    "productionTip": "Trong Redis, luôn đặt TTL cho mọi key cache để tránh rò rỉ bộ nhớ RAM (OOM). Trong IP packet, TTL đếm số router hops để tránh gói tin chạy vòng lặp vô tận."
  },
  {
    "id": "fifo",
    "acronym": "FIFO",
    "fullForm": "First In, First Out",
    "pronunciation": "Đọc là \"Pha-i-phô\" /ˈfaɪ.foʊ/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Nguyên lý hàng đợi: Phần tử nào vào trước thì sẽ được lấy ra và xử lý trước (Cấu trúc dữ liệu Queue tiêu chuẩn).",
    "productionTip": "Trong Kafka hoặc SQS FIFO, việc đảm bảo thứ tự tuyệt đối bắt buộc message phải có chung Message Group ID / Partition Key."
  },
  {
    "id": "lifo",
    "acronym": "LIFO",
    "fullForm": "Last In, First Out",
    "pronunciation": "Đọc là \"Lai-phô\" /ˈlaɪ.foʊ/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Nguyên lý ngăn xếp: Phần tử nào vào sau cùng thì sẽ được lấy ra đầu tiên (Cấu trúc dữ liệu Stack / Call Stack của hàm).",
    "productionTip": "Thường dùng trong thuật toán DFS (Depth-First Search), cơ chế hoàn tác Undo/Redo, và quản lý Call Frames trên thread stack của CPU."
  },
  {
    "id": "lru",
    "acronym": "LRU",
    "fullForm": "Least Recently Used",
    "pronunciation": "Đọc từng chữ: \"L-R-U\" /ˌel.ɑːrˈjuː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Chính sách loại bỏ cache: Bản ghi có thời điểm truy cập gần nhất xa nhất trong quá khứ sẽ bị trục xuất trước tiên khi bộ nhớ đầy.",
    "productionTip": "Được triển khai trong Java bằng LinkedHashMap(capacity, loadFactor, true) kết hợp giữa Doubly LinkedList và HashMap để đạt O(1) get và put."
  },
  {
    "id": "lfu",
    "acronym": "LFU",
    "fullForm": "Least Frequently Used",
    "pronunciation": "Đọc từng chữ: \"L-F-U\" /ˌel.efˈjuː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Chính sách trục xuất cache: Bản ghi có tần suất (số lần) được truy cập ít nhất kể từ khi nạp vào cache sẽ bị loại bỏ trước khi bộ nhớ đầy.",
    "productionTip": "Cần có cơ chế làm suy giảm tần suất theo thời gian (Aging) để tránh việc các dữ liệu cũ đã tích lũy tần suất cao chiếm chỗ dữ liệu mới."
  },
  {
    "id": "rpc",
    "acronym": "RPC",
    "fullForm": "Remote Procedure Call",
    "pronunciation": "Đọc từng chữ: \"R-P-C\" /ˌɑːr.piːˈsiː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Gọi thủ tục từ xa: Giao thức cho phép một chương trình máy tính thực thi một hàm trên một máy chủ từ xa giống hệt như đang gọi một hàm cục bộ trong code.",
    "productionTip": "Che giấu sự phức tạp của mạng, nhưng lập trình viên phải luôn tính tới rủi ro mạng trễ, mất gói và xử lý idempotency."
  },
  {
    "id": "grpc",
    "acronym": "gRPC",
    "fullForm": "gRPC Remote Procedure Call (Google RPC)",
    "pronunciation": "Đọc là \"G-R-P-C\" /dʒiː.ɑːr.piːˈsiː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Framework RPC hiệu năng cao của Google, chạy trên nền HTTP/2 và sử dụng Protocol Buffers để đóng gói dữ liệu nhị phân siêu gọn nhẹ.",
    "productionTip": "Nhỏ gọn gấp 7 lần và nhanh gấp 10 lần so với JSON/REST, chuẩn hóa giao tiếp liên dịch vụ nội bộ (east-west traffic) trong microservices."
  },
  {
    "id": "idl",
    "acronym": "IDL",
    "fullForm": "Interface Definition Language",
    "pronunciation": "Đọc từng chữ: \"I-D-L\" /ˌaɪ.diːˈel/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Ngôn ngữ định nghĩa giao diện trung lập: Mô tả cấu trúc dữ liệu và API độc lập với ngôn ngữ lập trình (như file .proto trong Protobuf).",
    "productionTip": "Tạo ra hợp đồng API (contract-first development) mạnh mẽ, tự động sinh mã nguồn client/server cho Java, Go, Python, C++, TypeScript."
  },
  {
    "id": "hld",
    "acronym": "HLD",
    "fullForm": "High-Level Design",
    "pronunciation": "Đọc từng chữ: \"H-L-D\" /ˌeɪtʃ.elˈdiː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Thiết kế mức cao: Tài liệu kiến trúc tổng thể mô tả các thành phần hệ thống lớn, luồng dữ liệu, giao thức mạng, load balancing và phân mảnh database.",
    "productionTip": "Là trọng tâm của các vòng phỏng vấn System Design dành cho Senior/Staff/Principal Engineer."
  },
  {
    "id": "lld",
    "acronym": "LLD",
    "fullForm": "Low-Level Design",
    "pronunciation": "Đọc từng chữ: \"L-L-D\" /ˌel.elˈdiː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Thiết kế mức thấp: Đặc tả chi tiết cấu trúc class, design patterns, lược đồ database, method signatures, quản lý luồng và xử lý ngoại lệ.",
    "productionTip": "Được đánh giá thông qua các bài test Machine Coding hoặc OOP Design (thiết kế Parking Lot, Elevator System, Chess Game)."
  },
  {
    "id": "ddd",
    "acronym": "DDD",
    "fullForm": "Domain-Driven Design",
    "pronunciation": "Đọc từng chữ: \"D-D-D\" /ˌdiː.diːˈdiː/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Phương pháp thiết kế phần mềm hướng nghiệp vụ: Đặt trọng tâm vào việc mô hình hóa chính xác miền nghiệp vụ thực tế (Ubiquitous Language, Bounded Context, Aggregates).",
    "productionTip": "Bounded Context của DDD là tiêu chí chuẩn xác nhất để phân chia ranh giới các Microservices thay vì chia theo bảng database kỹ thuật."
  },
  {
    "id": "spof",
    "acronym": "SPOF",
    "fullForm": "Single Point of Failure",
    "pronunciation": "Đọc là \"S-pốp\" /spɒf/ hoặc \"S-P-O-F\"",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Điểm lỗi đơn lẻ: Một thành phần trong hệ thống mà nếu nó bị sập thì toàn bộ hệ thống lớn sẽ ngừng hoạt động hoàn toàn.",
    "productionTip": "Kỹ sư cần chủ động loại bỏ SPOF bằng cách thêm node dự phòng (Redundancy), cân bằng tải và cơ chế failover tự động."
  },
  {
    "id": "tps",
    "acronym": "TPS",
    "fullForm": "Transactions Per Second",
    "pronunciation": "Đọc từng chữ: \"T-P-S\" /ˌtiː.piːˈes/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Số giao dịch hoàn tất trên mỗi giây: Chỉ số đo lường hiệu năng xử lý các giao dịch nghiệp vụ hoàn chỉnh (thường có tính chất ACID).",
    "productionTip": "Visa xử lý trung bình ~1,700 TPS; Ethereum ~15-30 TPS; Solana ~2,000-4,000 TPS."
  },
  {
    "id": "qps",
    "acronym": "QPS",
    "fullForm": "Queries Per Second",
    "pronunciation": "Đọc từng chữ: \"Q-P-S\" /ˌkjuː.piːˈes/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Số câu truy vấn trên mỗi giây: Đo lường tải của các hệ thống tìm kiếm (Search Engines) hoặc cơ sở dữ liệu đọc.",
    "productionTip": "Một HTTP request có thể kích hoạt hàng chục QPS tới database nếu mã nguồn bị lỗi N+1 Query."
  },
  {
    "id": "rps",
    "acronym": "RPS",
    "fullForm": "Requests Per Second",
    "pronunciation": "Đọc từng chữ: \"R-P-S\" /ˌɑːr.piːˈes/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Số yêu cầu HTTP/gRPC máy chủ tiếp nhận và phản hồi trên mỗi giây: Thước đo cơ bản nhất về thông lượng tải của API Gateway và Web Services.",
    "productionTip": "Luôn xem xét kèm phân phối thời gian trễ: 10,000 RPS với p99 < 50ms có ý nghĩa vượt trội so với 10,000 RPS nhưng p99 > 2,000ms."
  },
  {
    "id": "ha",
    "acronym": "HA",
    "fullForm": "High Availability",
    "pronunciation": "Đọc từng chữ: \"H-A\" /ˌeɪtʃˈeɪ/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Tính sẵn sàng cao: Đặc tính của hệ thống được thiết kế để duy trì hoạt động liên tục trong thời gian dài (thường đo bằng số số 9, ví dụ 99.99%).",
    "productionTip": "Đòi hỏi không có SPOF, nhân bản dữ liệu liên vùng (Multi-AZ), và quy trình failover tự động không cần người can thiệp."
  },
  {
    "id": "acid",
    "acronym": "ACID",
    "fullForm": "Atomicity, Consistency, Isolation, Durability",
    "pronunciation": "Đọc là \"A-xít\" /ˈæs.ɪd/ (như từ acid hóa học)",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Bộ 4 tiêu chuẩn giao dịch đảm bảo độ tin cậy dữ liệu: Nguyên tử (tất cả hoặc không gì cả), Nhất quán, Cách ly, Bền vững.",
    "productionTip": "Trong SQL, Isolation Level kiểm soát trực tiếp mức độ cách ly giữa các transaction (Read Uncommitted, Read Committed, Repeatable Read, Serializable)."
  },
  {
    "id": "mvcc",
    "acronym": "MVCC",
    "fullForm": "Multi-Version Concurrency Control",
    "pronunciation": "Đọc từng chữ: \"M-V-C-C\" /ˌem.viː.siːˈsiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Kiểm soát đồng thời đa phiên bản: Cho phép câu lệnh đọc (SELECT) không bao giờ bị khóa bởi lệnh ghi (UPDATE/DELETE) bằng cách duy trì các phiên bản snapshot cũ.",
    "productionTip": "PostgreSQL dùng xmin/xmax; MySQL InnoDB dùng Undo Logs trong ibdata để tái tạo snapshot tại thời điểm bắt đầu transaction."
  },
  {
    "id": "cdc",
    "acronym": "CDC",
    "fullForm": "Change Data Capture",
    "pronunciation": "Đọc từng chữ: \"C-D-C\" /ˌsiː.diːˈsiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Kỹ thuật bắt thay đổi dữ liệu: Trích xuất trực tiếp các sự kiện INSERT, UPDATE, DELETE từ file transaction log của database (binlog, WAL) và stream thời gian thực tới Kafka.",
    "productionTip": "Giải quyết dứt điểm vấn đề Dual-Write: Ứng dụng chỉ ghi vào DB, CDC tự động stream sang ElasticSearch và Redis cache với độ tin cậy tuyệt đối."
  },
  {
    "id": "rdbms",
    "acronym": "RDBMS",
    "fullForm": "Relational Database Management System",
    "pronunciation": "Đọc là \"R-D-B-M-S\" /ˌɑːr.diː.biː.emˈes/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Hệ quản trị cơ sở dữ liệu quan hệ: Lưu trữ dữ liệu dạng bảng có cấu trúc xác định trước, liên kết bằng khóa ngoại và truy vấn bằng SQL (PostgreSQL, MySQL, Oracle).",
    "productionTip": "RDBMS mạnh nhất về bảo toàn toàn vẹn dữ liệu và các phép JOIN phức tạp, nhưng scale ngang (Horizontal Sharding) rất tốn kém."
  },
  {
    "id": "nosql",
    "acronym": "NoSQL",
    "fullForm": "Not Only SQL",
    "pronunciation": "Đọc là \"Nô-ét-kiu-en\" /ˈnoʊ.es.kjuːˈel/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Hệ thống cơ sở dữ liệu phi quan hệ, phi cấu trúc cố định, thiết kế chuyên biệt cho việc mở rộng theo chiều ngang (MongoDB, Redis, Cassandra, Neo4j).",
    "productionTip": "Chọn NoSQL khi mô hình dữ liệu thay đổi liên tục hoặc cần thông lượng ghi hàng trăm nghìn record mỗi giây trên cụm phân tán."
  },
  {
    "id": "oltp",
    "acronym": "OLTP",
    "fullForm": "Online Transaction Processing",
    "pronunciation": "Đọc là \"O-L-T-P\" /ˌoʊ.el.tiːˈpiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Xử lý giao dịch trực tuyến: Hệ thống phục vụ các giao dịch ngắn hàng ngày, đọc/ghi nhanh trên từng bản ghi cụ thể (đặt hàng, chuyển khoản).",
    "productionTip": "Cơ sở dữ liệu OLTP (MySQL, Postgres) được thiết kế tối ưu cho B+Tree index và độ trễ mili-giây, thiết kế bảng chuẩn hóa 3NF."
  },
  {
    "id": "olap",
    "acronym": "OLAP",
    "fullForm": "Online Analytical Processing",
    "pronunciation": "Đọc là \"O-L-A-P\" /ˈoʊ.læp/ hoặc /ˌoʊ.el.eɪˈpiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Xử lý phân tích trực tuyến: Hệ thống kho dữ liệu chuyên phục vụ các truy vấn phức tạp, tổng hợp (SUM, AVG, COUNT) trên hàng tỷ dòng dữ liệu để tạo báo cáo.",
    "productionTip": "Database OLAP (ClickHouse, Snowflake, BigQuery) lưu trữ dạng cột (Columnar Storage) giúp nén dữ liệu cực cao và quét đọc hàng triệu record/giây."
  },
  {
    "id": "tsdb",
    "acronym": "TSDB",
    "fullForm": "Time Series Database",
    "pronunciation": "Đọc là \"T-S-D-B\" /ˌtiː.es.diːˈbiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Cơ sở dữ liệu chuỗi thời gian: Tối ưu chuyên biệt cho việc lưu trữ và phân tích các cặp dữ liệu kèm timestamp theo thời gian liên tục (Prometheus, InfluxDB).",
    "productionTip": "Tối ưu để ghi tuần tự tốc độ cực cao và tự động nén, cắt tỉa (Retention policy) dữ liệu cũ."
  },
  {
    "id": "htap",
    "acronym": "HTAP",
    "fullForm": "Hybrid Transactional/Analytical Processing",
    "pronunciation": "Đọc là \"H-T-A-P\" /ˌeɪtʃ.tiː.eɪˈpiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Xử lý kết hợp giao dịch và phân tích: Kiến trúc database hiện đại (TiDB, SingleStore) cho phép vừa xử lý giao dịch OLTP vừa chạy truy vấn báo cáo OLAP trên cùng một dữ liệu thời gian thực.",
    "productionTip": "Loại bỏ hoàn toàn sự chậm trễ của các đường ống ETL truyền thống, cho phép xem báo cáo phân tích theo thời gian thực 0-delay."
  },
  {
    "id": "crud",
    "acronym": "CRUD",
    "fullForm": "Create, Read, Update, Delete",
    "pronunciation": "Đọc là \"Crớt\" /krʌd/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "4 thao tác cơ bản nhất của việc quản lý dữ liệu bền vững: Tạo mới (INSERT/POST), Đọc (SELECT/GET), Cập nhật (UPDATE/PUT), Xóa (DELETE).",
    "productionTip": "Đại đa số các ứng dụng cơ bản đều xoay quanh CRUD. Khi quy mô lớn lên, các tác vụ ghi phức tạp thường được chuyển sang mô hình Command / Event-Driven."
  },
  {
    "id": "orm",
    "acronym": "ORM",
    "fullForm": "Object-Relational Mapping",
    "pronunciation": "Đọc là \"O-R-M\" /ˌoʊ.ɑːrˈem/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Kỹ thuật lập trình ánh xạ giữa các bảng cơ sở dữ liệu quan hệ và các đối tượng (Objects/Classes) trong OOP (Hibernate, JPA, Prisma).",
    "productionTip": "Tiện lợi và tăng tốc phát triển, nhưng dễ gây bẫy hiệu năng N+1 query hoặc sinh ra các câu lệnh SQL cồng kềnh nếu thiếu kinh nghiệm tối ưu fetch plan."
  },
  {
    "id": "cte",
    "acronym": "CTE",
    "fullForm": "Common Table Expression",
    "pronunciation": "Đọc từng chữ: \"C-T-E\" /ˌsiː.tiːˈiː/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Biểu thức bảng chung trong SQL (mệnh đề WITH): Tạo ra một tập kết quả tạm thời tồn tại trong phạm vi câu lệnh đơn, hỗ trợ đệ quy hiệu quả.",
    "productionTip": "Recursive CTE là giải pháp kinh điển và hiệu quả nhất trong SQL để duyệt qua cấu trúc dữ liệu cây (Org Chart, danh mục đa cấp)."
  },
  {
    "id": "ddl",
    "acronym": "DDL",
    "fullForm": "Data Definition Language",
    "pronunciation": "Đọc từng chữ: \"D-D-L\" /ˌdiː.diːˈel/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Nhóm lệnh định nghĩa cấu trúc dữ liệu trong SQL: CREATE, ALTER, DROP, TRUNCATE.",
    "productionTip": "Lệnh DDL thường thực hiện ngầm câu lệnh COMMIT và có thể lock bảng dữ liệu lớn nếu chạy trực tiếp trên production mà không dùng công cụ online schema change (gh-ost, pt-online-schema-change)."
  },
  {
    "id": "dml",
    "acronym": "DML",
    "fullForm": "Data Manipulation Language",
    "pronunciation": "Đọc từng chữ: \"D-M-L\" /ˌdiː.emˈel/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Nhóm lệnh thao tác trực tiếp trên dữ liệu trong SQL: INSERT, UPDATE, DELETE.",
    "productionTip": "Các thao tác DML luôn nằm trong phạm vi giao dịch (Transaction) và cần có COMMIT hoặc ROLLBACK rõ ràng."
  },
  {
    "id": "dql",
    "acronym": "DQL",
    "fullForm": "Data Query Language",
    "pronunciation": "Đọc từng chữ: \"D-Q-L\" /ˌdiː.kjuːˈel/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Nhóm lệnh truy vấn dữ liệu trong SQL: Đại diện chính là lệnh SELECT.",
    "productionTip": "DQL là nhóm lệnh được sử dụng nhiều nhất, chiếm 80-90% lưu lượng của các hệ thống cơ sở dữ liệu đọc thông thường."
  },
  {
    "id": "iops",
    "acronym": "IOPS",
    "fullForm": "Input/Output Operations Per Second",
    "pronunciation": "Đọc là \"Ai-óp-s\" /ˈaɪ.ɒps/",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Số thao tác đọc/ghi trên ổ cứng mỗi giây: Chỉ số quan trọng hàng đầu phản ánh tốc độ phần cứng ổ đĩa lưu trữ (SSD, NVMe, AWS EBS gp3/io2).",
    "productionTip": "Ổ cứng cơ HDD chỉ đạt ~100-200 IOPS; SSD SATA đạt ~50,000 IOPS; NVMe SSD có thể đạt trên 1,000,000 IOPS."
  },
  {
    "id": "mmu",
    "acronym": "MMU",
    "fullForm": "Memory Management Unit",
    "pronunciation": "Đọc từng chữ: \"M-M-U\" /ˌem.emˈjuː/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Bộ quản lý bộ nhớ phần cứng trong CPU: Chịu trách nhiệm phiên dịch địa chỉ bộ nhớ ảo (Virtual Address) thành địa chỉ RAM vật lý thực tế (Physical Address).",
    "productionTip": "Nếu địa chỉ ảo không tồn tại trong RAM, MMU kích hoạt ngắt phần cứng Page Fault để hệ điều hành nạp dữ liệu từ ổ cứng vào RAM."
  },
  {
    "id": "tlb",
    "acronym": "TLB",
    "fullForm": "Translation Lookaside Buffer",
    "pronunciation": "Đọc từng chữ: \"T-L-B\" /ˌtiː.elˈbiː/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Bộ nhớ đệm phần cứng siêu tốc bên trong CPU lưu trữ các ánh xạ trang nhớ gần đây giữa Virtual Memory và Physical Memory.",
    "productionTip": "Mỗi lần OS Context Switch giữa 2 process khác nhau, toàn bộ TLB thường bị xóa sạch (Flush), khiến các lệnh truy cập bộ nhớ sau đó bị trễ đáng kể."
  },
  {
    "id": "rss",
    "acronym": "RSS",
    "fullForm": "Resident Set Size",
    "pronunciation": "Đọc từng chữ: \"R-S-S\" /ˌɑːr.esˈes/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Dung lượng bộ nhớ RAM vật lý thực tế mà một tiến trình đang chiếm giữ tại một thời điểm (không bao gồm các trang bộ nhớ đã bị Swap ra đĩa).",
    "productionTip": "Linux cgroup OOM Killer dựa vào RSS để quyết định tiêu diệt container Pod nào khi Kubernetes node bị cạn kiệt RAM (Exit Code 137)."
  },
  {
    "id": "vsz",
    "acronym": "VSZ",
    "fullForm": "Virtual Memory Size",
    "pronunciation": "Đọc từng chữ: \"V-S-Z\" /ˌviː.esˈzed/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Tổng kích thước không gian bộ nhớ ảo mà một tiến trình có thể truy cập, bao gồm mã nhị phân, heap, stack, các thư viện dùng chung và cả vùng nhớ đã cấp phát nhưng chưa dùng.",
    "productionTip": "VSZ luôn lớn hơn rất nhiều so với RSS. Một ứng dụng Java có thể có VSZ 8GB nhưng RSS thực tế trong RAM chỉ 500MB."
  },
  {
    "id": "ipc",
    "acronym": "IPC",
    "fullForm": "Inter-Process Communication",
    "pronunciation": "Đọc từng chữ: \"I-P-C\" /ˌaɪ.piːˈsiː/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Cơ chế giao tiếp liên tiến trình: Các phương thức cho phép các tiến trình độc lập trao đổi dữ liệu với nhau trên cùng một máy (Pipes, Sockets, Shared Memory, Message Queues).",
    "productionTip": "Shared Memory là phương thức IPC nhanh nhất vì không cần copy dữ liệu qua Kernel Space, nhưng đòi hỏi phải tự đồng bộ khóa (Mutex/Semaphore)."
  },
  {
    "id": "numa",
    "acronym": "NUMA",
    "fullForm": "Non-Uniform Memory Access",
    "pronunciation": "Đọc là \"Nu-ma\" /ˈnuː.mə/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Kiến trúc phần cứng máy chủ đa CPU: Mỗi CPU socket có một vùng RAM cục bộ (Local Memory) truy cập cực nhanh, trong khi truy cập sang RAM của CPU socket khác (Remote Memory) bị trễ hơn.",
    "productionTip": "Chạy Java và Database trên máy chủ NUMA cần kích hoạt cờ -XX:+UseNUMA hoặc lệnh numactl --interleave để tránh nghẽn băng thông memory bus."
  },
  {
    "id": "cas",
    "acronym": "CAS",
    "fullForm": "Compare-And-Swap",
    "pronunciation": "Đọc là \"Cát-s\" /kæs/ hoặc \"C-A-S\"",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Lệnh nguyên tử phần cứng CPU (cmpxchg): So sánh giá trị tại một ô nhớ với giá trị kỳ vọng; nếu khớp thì cập nhật giá trị mới, nếu không khớp thì bỏ qua.",
    "productionTip": "Là nền tảng cốt lõi của lập trình không khóa (Lock-Free programming), AtomicInteger, ConcurrentHashMap và LMAX Disruptor."
  },
  {
    "id": "fd",
    "acronym": "FD",
    "fullForm": "File Descriptor",
    "pronunciation": "Đọc từng chữ: \"F-D\" /ˌefˈdiː/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Chỉ số nguyên đại diện cho một tệp tin hoặc kết nối mạng (Socket) đang mở trong hệ điều hành Unix/Linux (0: stdin, 1: stdout, 2: stderr).",
    "productionTip": "Trong Linux, mọi thứ đều là File. Máy chủ HTTP/WebSocket chịu tải cao sẽ bị lỗi \"Too many open files\" nếu không nâng giới hạn ulimit -n lên 65,536+."
  },
  {
    "id": "tcp",
    "acronym": "TCP",
    "fullForm": "Transmission Control Protocol",
    "pronunciation": "Đọc từng chữ: \"T-C-P\" /ˌtiː.siːˈpiː/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Giao thức truyền vận tin cậy, hướng kết nối: Đảm bảo dữ liệu đến đích nguyên vẹn, đúng thứ tự thông qua 3-way handshake, số thứ tự ACK và kiểm soát tắc nghẽn.",
    "productionTip": "Tin cậy nhưng có độ trễ lớn hơn UDP do chi phí bắt tay kết nối và hiện tượng Head-of-Line Blocking khi bị mất gói tin."
  },
  {
    "id": "udp",
    "acronym": "UDP",
    "fullForm": "User Datagram Protocol",
    "pronunciation": "Đọc từng chữ: \"U-D-P\" /ˌjuː.diːˈpiː/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Giao thức truyền vận không hướng kết nối: Gửi các gói tin độc lập (Datagrams) mà không cần bắt tay kết nối, không đảm bảo thứ tự và không gửi lại khi mất gói.",
    "productionTip": "Sử dụng cho các ứng dụng ưu tiên tốc độ và độ trễ tối thiểu: Livestreaming video, game online, DNS query, VoIP và giao thức QUIC (HTTP/3)."
  },
  {
    "id": "tls",
    "acronym": "TLS",
    "fullForm": "Transport Layer Security",
    "pronunciation": "Đọc từng chữ: \"T-L-S\" /ˌtiː.elˈes/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Giao thức mật mã hóa đường truyền kế thừa SSL: Cung cấp tính bảo mật (mã hóa dữ liệu), tính toàn vẹn (chống giả mạo) và xác thực danh tính server qua chứng chỉ số.",
    "productionTip": "TLS 1.3 rút ngắn thời gian bắt tay xuống chỉ còn 1-RTT (hoặc 0-RTT resumption) so với 2-RTT của phiên bản TLS 1.2 cũ."
  },
  {
    "id": "quic",
    "acronym": "QUIC",
    "fullForm": "Quick UDP Internet Connections",
    "pronunciation": "Đọc là \"Quých\" /kwɪk/ (như từ quick)",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Giao thức mạng tầng truyền vận chạy trên nền UDP, tích hợp sẵn mã hóa TLS 1.3 mặc định, hỗ trợ ghép kênh độc lập (Multiplexing) và di chuyển kết nối mượt mà.",
    "productionTip": "QUIC là nền tảng cốt lõi của giao thức HTTP/3, loại bỏ hoàn toàn vấn đề Head-of-Line Blocking của TCP khi chuyển mạng Wi-Fi sang 4G/5G."
  },
  {
    "id": "cors",
    "acronym": "CORS",
    "fullForm": "Cross-Origin Resource Sharing",
    "pronunciation": "Đọc là \"Co-z\" /kɔːrz/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Cơ chế bảo mật của trình duyệt web (Browser) ngăn chặn mã JavaScript từ domain nguồn này gọi và đọc dữ liệu từ domain đích khác nếu không có header cho phép.",
    "productionTip": "CORS là chính sách do TRÌNH DUYỆT thực thi. Các công cụ như curl, Postman hay gọi API backend-to-backend hoàn toàn không bị ảnh hưởng bởi CORS."
  },
  {
    "id": "sse",
    "acronym": "SSE",
    "fullForm": "Server-Sent Events",
    "pronunciation": "Đọc từng chữ: \"S-S-E\" /ˌes.esˈiː/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Công nghệ web cho phép máy chủ chủ động đẩy dữ liệu thời gian thực tới trình duyệt theo một chiều (Server-to-Client) thông qua một kết nối HTTP tiêu chuẩn.",
    "productionTip": "Nhẹ hơn và dễ triển khai hơn WebSocket rất nhiều khi bạn chỉ cần cập nhật dữ liệu một chiều (bảng giá chứng khoán, thông báo chuông, streaming câu trả lời AI ChatGPT)."
  },
  {
    "id": "rest",
    "acronym": "REST",
    "fullForm": "Representational State Transfer",
    "pronunciation": "Đọc là \"Rét-st\" /rest/ (như từ rest)",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Phong cách kiến trúc phần mềm cho các hệ thống siêu phương tiện phân tán: Tận dụng các phương thức chuẩn của HTTP (GET, POST, PUT, DELETE) và phi trạng thái (Stateless).",
    "productionTip": "Chuẩn mực của RESTful API: URL biểu diễn tài nguyên (Danh từ, ví dụ /api/v1/orders), phương thức HTTP biểu diễn hành động (GET để đọc, POST để tạo)."
  },
  {
    "id": "mtu",
    "acronym": "MTU",
    "fullForm": "Maximum Transmission Unit",
    "pronunciation": "Đọc từng chữ: \"M-T-U\" /ˌem.tiːˈjuː/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Kích thước gói tin lớn nhất (bytes) có thể truyền qua một giao diện mạng mà không bị phân mảnh. Chuẩn Ethernet thông thường là 1,500 bytes.",
    "productionTip": "Trong đám mây AWS VPC, bạn có thể bật Jumbo Frames (MTU 9,001 bytes) để tăng gấp 6 lần thông lượng truyền dữ liệu giữa các máy chủ EC2."
  },
  {
    "id": "mss",
    "acronym": "MSS",
    "fullForm": "Maximum Segment Size",
    "pronunciation": "Đọc từng chữ: \"M-S-S\" /ˌem.esˈes/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Lượng dữ liệu payload tối đa mà một máy tính có thể nhận trong một phân đoạn TCP duy nhất. Thường bằng MTU trừ đi 40 bytes header (20 bytes IP + 20 bytes TCP): 1,460 bytes.",
    "productionTip": "Được thỏa thuận trong gói tin TCP SYN ban đầu giữa Client và Server để tránh việc các router trung gian phải chia nhỏ gói tin."
  },
  {
    "id": "rtt",
    "acronym": "RTT",
    "fullForm": "Round-Trip Time",
    "pronunciation": "Đọc từng chữ: \"R-T-T\" /ˌɑːr.tiːˈtiː/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Thời gian tính bằng mili-giây cần thiết để một gói tin đi từ nguồn tới đích và gói phản hồi xác nhận (ACK) quay ngược trở lại nguồn.",
    "productionTip": "Bị giới hạn bởi tốc độ ánh sáng trong sợi quang (~200,000 km/s): RTT tối thiểu từ Tokyo đến New York không bao giờ nhỏ hơn ~140ms."
  },
  {
    "id": "jvm",
    "acronym": "JVM",
    "fullForm": "Java Virtual Machine",
    "pronunciation": "Đọc từng chữ: \"J-V-M\" /ˌdʒeɪ.viːˈem/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Máy ảo Java: Môi trường thực thi trừu tượng chịu trách nhiệm nạp bytecode, thực thi mã nguồn thông qua JIT compiler, quản lý bộ nhớ và thu gom rác tự động (GC).",
    "productionTip": "Chính JVM là nền tảng đa nền tảng \"Write Once, Run Anywhere\" chạy được cả Kotlin, Scala, Groovy, Clojure."
  },
  {
    "id": "jdk",
    "acronym": "JDK",
    "fullForm": "Java Development Kit",
    "pronunciation": "Đọc từng chữ: \"J-D-K\" /ˌdʒeɪ.diːˈkeɪ/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Bộ công cụ phát triển Java dành cho lập trình viên, bao gồm trình biên dịch (javac), máy ảo JVM, thư viện lõi chuẩn và các công cụ chẩn đoán (jstack, jmap, jcmd).",
    "productionTip": "Khi triển khai container Docker cho môi trường Production, chỉ cần dùng JRE / Runtime image nhẹ thay vì cả JDK đầy đủ để tiết kiệm RAM và dung lượng đĩa."
  },
  {
    "id": "jit",
    "acronym": "JIT",
    "fullForm": "Just-In-Time Compiler",
    "pronunciation": "Đọc là \"Jít\" /dʒɪt/ hoặc từng chữ \"J-I-T\"",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Trình biên dịch tức thời của JVM: Phân tích mã bytecode đang chạy, xác định các điểm nóng (Hotspots) và biên dịch thẳng thành mã máy CPU để đạt tốc độ tương đương C/C++.",
    "productionTip": "Cơ chế Tiered Compilation gồm C1 Compiler (biên dịch nhanh) và C2 Compiler (tối ưu hóa chuyên sâu như method inlining, loop unrolling, escape analysis)."
  },
  {
    "id": "aot",
    "acronym": "AOT",
    "fullForm": "Ahead-Of-Time Compilation",
    "pronunciation": "Đọc từng chữ: \"A-O-T\" /ˌeɪ.oʊˈtiː/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Biên dịch trước thời hạn: Biên dịch toàn bộ mã Java thành file thực thi nhị phân máy ảo độc lập (Native Executable qua GraalVM) trước khi chạy, không cần JVM runtime.",
    "productionTip": "Thời gian khởi động giảm từ vài giây xuống còn 15ms, tiêu tốn ít RAM hơn 5 lần, cực kỳ lý tưởng cho Serverless AWS Lambda và Kubernetes Pod auto-scaling."
  },
  {
    "id": "gc",
    "acronym": "GC",
    "fullForm": "Garbage Collection / Garbage Collector",
    "pronunciation": "Đọc từng chữ: \"G-C\" /ˌdʒiːˈsiː/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Cơ chế thu gom rác tự động của JVM: Tự động phát hiện và thu hồi vùng nhớ Heap của các đối tượng không còn chuỗi tham chiếu sống từ các GC Roots.",
    "productionTip": "G1 GC là lựa chọn mặc định cân bằng; ZGC đem lại độ trễ siêu thấp dưới 1 mili-giây cho heap hàng terabytes."
  },
  {
    "id": "stw",
    "acronym": "STW",
    "fullForm": "Stop-The-World",
    "pronunciation": "Đọc từng chữ: \"S-T-W\" /ˌes.tiːˈdʌb.əl.juː/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Tạm dừng toàn bộ thế giới: Giai đoạn trong quá trình thu gom rác khi JVM bắt buộc phải tạm dừng tất cả các luồng ứng dụng Java (tại các Safepoints) để di chuyển object an toàn.",
    "productionTip": "ZGC và Shenandoah đạt được độ trễ STW cực nhỏ (<1ms) vì chúng thực hiện phần lớn công việc đánh dấu và di chuyển object đồng thời trong lúc app vẫn chạy."
  },
  {
    "id": "jmm",
    "acronym": "JMM",
    "fullForm": "Java Memory Model",
    "pronunciation": "Đọc từng chữ: \"J-M-M\" /ˌdʒeɪ.emˈem/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Mô hình bộ nhớ Java: Quy định hành vi và trật tự hiển thị giá trị biến (Visibility) giữa bộ nhớ đệm CPU của từng thread và bộ nhớ dùng chung thông qua quan hệ Happens-Before.",
    "productionTip": "Từ khóa volatile và synchronized áp dụng quan hệ Happens-Before, chèn các rào cản bộ nhớ phần cứng (Memory Barriers) để chống CPU đảo thứ tự lệnh."
  },
  {
    "id": "pecs",
    "acronym": "PECS",
    "fullForm": "Producer Extends, Consumer Super",
    "pronunciation": "Đọc là \"Péc-s\" /peks/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Nguyên tắc vàng khi dùng Generic Wildcards trong Java (Joshua Bloch): Nếu collection chỉ cung cấp dữ liệu (Producer/Read), dùng <? extends T>; nếu collection nhận dữ liệu vào (Consumer/Write), dùng <? super T>.",
    "productionTip": "Ví dụ: Collections.copy(List<? super T> dest, List<? extends T> src) thể hiện hoàn hảo nguyên tắc PECS."
  },
  {
    "id": "dcl",
    "acronym": "DCL",
    "fullForm": "Double-Checked Locking",
    "pronunciation": "Đọc từng chữ: \"D-C-L\" /ˌdiː.siːˈel/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Mẫu khóa kiểm tra hai lần trong khởi tạo Lazy Singleton: Kiểm tra null lần 1 ngoài synchronized block để tối ưu hiệu năng, và kiểm tra null lần 2 bên trong synchronized block.",
    "productionTip": "Biến instance BẮT BUỘC phải khai báo với từ khóa volatile, nếu không lệnh khởi tạo new Object() sẽ bị CPU đảo lệnh, trả về tham chiếu rác chưa khởi tạo xong."
  },
  {
    "id": "ioc",
    "acronym": "IoC",
    "fullForm": "Inversion of Control",
    "pronunciation": "Đọc từng chữ: \"I-o-C\" /ˌaɪ.oʊˈsiː/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Đảo ngược điều khiển: Nguyên lý thiết kế trong đó quyền kiểm soát luồng chương trình và khởi tạo vòng đời đối tượng được chuyển giao cho Framework (như Spring Container).",
    "productionTip": "\"Don't call us, we'll call you\" (Nguyên lý Hollywood): Framework gọi code của bạn thay vì bạn chủ động gọi thư viện."
  },
  {
    "id": "di",
    "acronym": "DI",
    "fullForm": "Dependency Injection",
    "pronunciation": "Đọc từng chữ: \"D-I\" /ˌdiːˈaɪ/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Tiêm phụ thuộc: Kỹ thuật hiện thực hóa nguyên lý IoC, trong đó các đối tượng phụ thuộc (Dependencies) được đưa vào đối tượng từ bên ngoài (Constructor Injection) thay vì đối tượng tự new.",
    "productionTip": "Luôn ưu tiên Constructor Injection hơn Field Injection (@Autowired trên field) để phục vụ unit test độc lập và đảm bảo tính bất biến (final fields)."
  },
  {
    "id": "jwt",
    "acronym": "JWT",
    "fullForm": "JSON Web Token",
    "pronunciation": "Đọc là \"Jót\" /dʒɑːt/ hoặc từng chữ \"J-W-T\"",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Chuẩn mở (RFC 7519) định nghĩa chuỗi token an toàn, gọn nhẹ, tự chứa (Self-contained) gồm 3 phần: Header.Payload.Signature dùng để truyền tải thông tin xác thực danh tính.",
    "productionTip": "Ưu điểm là phi trạng thái (Stateless - không cần truy vấn DB), nhưng nhược điểm là không thể thu hồi tức thì trước khi hết hạn nếu không có Distributed Blacklist."
  },
  {
    "id": "oauth",
    "acronym": "OAuth / OAuth 2.0",
    "fullForm": "Open Authorization",
    "pronunciation": "Đọc là \"Âu-Ót\" /ˈoʊ.ɔːθ/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Khung ủy quyền phân quyền chuẩn công nghiệp: Cho phép ứng dụng bên thứ ba được cấp quyền truy cập có giới hạn vào tài nguyên người dùng mà không bao giờ cần biết mật khẩu của họ.",
    "productionTip": "OAuth 2.0 là giao thức AUTHORIZATION (ủy quyền), KHÔNG PHẢI là giao thức xác thực danh tính (Authentication). Muốn xác thực danh tính phải dùng OpenID Connect (OIDC)."
  },
  {
    "id": "oidc",
    "acronym": "OIDC",
    "fullForm": "OpenID Connect",
    "pronunciation": "Đọc là \"O-I-D-C\" /ˌoʊ.aɪ.diːˈsiː/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Lớp xác thực danh tính người dùng (Authentication) được xây dựng ngay trên nền tảng OAuth 2.0, bổ sung thêm ID Token (dưới dạng JWT) chứa thông tin profile người dùng đã đăng nhập.",
    "productionTip": "ID Token dùng cho ứng dụng Client biết bạn là ai; Access Token dùng cho Resource Server biết bạn được phép làm gì."
  },
  {
    "id": "sso",
    "acronym": "SSO",
    "fullForm": "Single Sign-On",
    "pronunciation": "Đọc từng chữ: \"S-S-O\" /ˌes.esˈoʊ/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Đăng nhập một lần: Cơ chế xác thực cho phép người dùng đăng nhập một lần duy nhất với tài khoản trung tâm và truy cập vào nhiều ứng dụng độc lập khác nhau mà không phải nhập lại mật khẩu.",
    "productionTip": "Dựa trên các chuẩn SAML 2.0, OpenID Connect hoặc CAS, giúp giảm mệt mỏi đặt mật khẩu và tăng cường quản trị bảo mật doanh nghiệp."
  },
  {
    "id": "mfa",
    "acronym": "MFA / 2FA",
    "fullForm": "Multi-Factor Authentication / Two-Factor Authentication",
    "pronunciation": "Đọc từng chữ: \"M-F-A\" /ˌem.efˈeɪ/ hoặc \"Tu-F-A\"",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Xác thực đa yếu tố: Cơ chế bảo mật yêu cầu người dùng cung cấp từ hai bằng chứng xác thực độc lập trở lên: Thứ bạn biết (Mật khẩu), Thứ bạn có (Điện thoại OTP), Thứ bạn là (Sinh trắc học).",
    "productionTip": "Bảo vệ tài khoản an toàn tới 99% ngay cả khi mật khẩu đã bị lộ trong các vụ rò rỉ cơ sở dữ liệu."
  },
  {
    "id": "pkce",
    "acronym": "PKCE",
    "fullForm": "Proof Key for Code Exchange",
    "pronunciation": "Đọc là \"Pích-xi\" /ˈpɪk.si/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Phần mở rộng bảo mật bắt buộc của OAuth 2.0 cho Frontend SPA và Mobile: Sử dụng cặp khóa ngẫu nhiên Code Verifier và Code Challenge (SHA-256) để chống tấn công đánh cắp Authorization Code.",
    "productionTip": "Trong OAuth 2.1, luồng Implicit Flow bị khai tử hoàn toàn; PKCE là yêu cầu bắt buộc cho tất cả các loại ứng dụng."
  },
  {
    "id": "rbac",
    "acronym": "RBAC",
    "fullForm": "Role-Based Access Control",
    "pronunciation": "Đọc là \"Rờ-bắc\" /ˈɑːr.bæk/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Kiểm soát truy cập dựa trên vai trò: Gán quyền hạn (Permissions) vào các vai trò cụ thể (Admin, Editor, Viewer), sau đó gán người dùng vào một hoặc nhiều vai trò tương ứng.",
    "productionTip": "Dễ triển khai và quản trị cho 90% ứng dụng. Khi logic phân quyền phụ thuộc vào ngữ cảnh động (thời gian, phòng ban), cần chuyển sang ABAC."
  },
  {
    "id": "polp",
    "acronym": "PoLP",
    "fullForm": "Principle of Least Privilege",
    "pronunciation": "Đọc là \"Pôn-p\" /pɒlp/ hoặc \"P-o-L-P\"",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Nguyên tắc đặc quyền tối thiểu: Mọi người dùng, tiến trình và service account chỉ được cấp vừa đủ các quyền hạn tối thiểu tuyệt đối cần thiết để hoàn thành công việc của mình.",
    "productionTip": "Không bao giờ cấp quyền AdministratorAccess cho IAM Role của service; luôn giới hạn quyền hạn theo đúng resource ARN cụ thể."
  },
  {
    "id": "xss",
    "acronym": "XSS",
    "fullForm": "Cross-Site Scripting",
    "pronunciation": "Đọc từng chữ: \"X-S-S\" /ˌeks.esˈes/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Tấn công chèn mã kịch bản chéo: Kẻ tấn công tiêm mã JavaScript độc hại vào trang web hợp lệ để trình duyệt của các nạn nhân khác tự động thực thi và đánh cắp token/cookie.",
    "productionTip": "Phòng chống hiệu quả nhất: Lưu trữ Access Token trong HttpOnly Cookie (JavaScript không thể đọc), mã hóa output HTML và kích hoạt header CSP (Content Security Policy)."
  },
  {
    "id": "csrf",
    "acronym": "CSRF",
    "fullForm": "Cross-Site Request Forgery",
    "pronunciation": "Đọc là \"C-S-R-F\" /ˌsiː.es.ɑːrˈef/ hoặc \"C-sơ-rúp\"",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Giả mạo yêu cầu chéo trang: Đánh lừa trình duyệt của nạn nhân (đang có session đăng nhập hợp lệ) tự động gửi request trái phép kèm Cookie tới server đích để thực hiện hành động ngoài ý muốn.",
    "productionTip": "Phòng chống hiện đại: Đặt SameSite=Lax hoặc SameSite=Strict cho Cookie, kết hợp với Anti-CSRF Token trong custom header cho các request POST/PUT/DELETE."
  },
  {
    "id": "ddos",
    "acronym": "DDoS",
    "fullForm": "Distributed Denial of Service",
    "pronunciation": "Đọc là \"Đi-đốt\" /ˈdiː.dɒs/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Tấn công từ chối dịch vụ phân tán: Kẻ tấn công sử dụng mạng lưới hàng nghìn máy tính bị nhiễm mã độc (Botnet) đồng loạt gửi lưu lượng rác khổng lồ để làm nghẽn băng thông và sập máy chủ mục tiêu.",
    "productionTip": "Giảm thiểu bằng dịch vụ CDN bảo vệ ở tầng biên (Cloudflare, AWS Shield), Rate Limiting và Web Application Firewall (WAF)."
  },
  {
    "id": "ci",
    "acronym": "CI",
    "fullForm": "Continuous Integration",
    "pronunciation": "Đọc từng chữ: \"C-I\" /ˌsiːˈaɪ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Tích hợp liên tục: Quy trình tự động hóa việc build mã nguồn và chạy toàn bộ bộ kiểm thử tự động (Unit test, Lint, Integration test) mỗi khi lập trình viên tạo Pull Request hoặc commit code mới.",
    "productionTip": "Quy tắc vàng của CI: Vòng lặp phản hồi (Feedback Loop) từ khi push code đến khi có kết quả test không được vượt quá 10 phút."
  },
  {
    "id": "cd",
    "acronym": "CD",
    "fullForm": "Continuous Delivery / Continuous Deployment",
    "pronunciation": "Đọc từng chữ: \"C-D\" /ˌsiːˈdiː/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Continuous Delivery là tự động đóng gói bản build sẵn sàng phát hành lên Production sau khi có phê duyệt thủ công; Continuous Deployment là tự động triển khai thẳng lên Production hoàn toàn tự động không cần người can thiệp.",
    "productionTip": "Continuous Deployment đòi hỏi hệ thống giám sát tự động cực kỳ tinh vi và khả năng tự động Rollback trong vòng 60 giây nếu canary phát hiện lỗi."
  },
  {
    "id": "iac",
    "acronym": "IaC",
    "fullForm": "Infrastructure as Code",
    "pronunciation": "Đọc là \"I-a-C\" /ˌaɪ.eɪˈsiː/ hoặc \"I-A-C\"",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Cơ sở hạ tầng dưới dạng mã: Quy trình quản lý và cấp phát tài nguyên máy chủ, mạng và database thông qua các file cấu hình mã nguồn có thể kiểm soát phiên bản (như Terraform, Pulumi, CloudFormation).",
    "productionTip": "Loại bỏ hoàn toàn cấu hình thủ công bằng tay trên Web Console (ClickOps) và ngăn chặn hiện tượng môi trường staging khác môi trường production (Configuration Drift)."
  },
  {
    "id": "gitops",
    "acronym": "GitOps",
    "fullForm": "Git Operations",
    "pronunciation": "Đọc là \"Gít-óp-s\" /ˈɡɪt.ɒps/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Mô hình vận hành hạ tầng Kubernetes sử dụng kho lưu trữ Git làm nguồn chân lý duy nhất (Single Source of Truth). Công cụ như ArgoCD/Flux tự động đồng bộ trạng thái thực tế của cluster với khai báo trong Git.",
    "productionTip": "Muốn deploy phiên bản mới hay tăng replica? Chỉ cần tạo Pull Request trên Git; khi merge PR, cluster tự động cập nhật mà không cần cấp quyền truy cập kubectl cho lập trình viên."
  },
  {
    "id": "sre",
    "acronym": "SRE",
    "fullForm": "Site Reliability Engineering",
    "pronunciation": "Đọc từng chữ: \"S-R-E\" /ˌes.ɑːrˈiː/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Kỹ nghệ đảm bảo độ tin cậy dịch vụ (do Google sáng lập): Áp dụng tư duy kỹ thuật phần mềm vào việc vận hành và tự động hóa các hệ thống quy mô lớn, cân bằng giữa tốc độ tính năng và độ ổn định hệ thống.",
    "productionTip": "\"SRE is what happens when you ask a software engineer to design an operations team.\" Áp dụng khái niệm Error Budget để quyết định tốc độ release."
  },
  {
    "id": "sla",
    "acronym": "SLA",
    "fullForm": "Service Level Agreement",
    "pronunciation": "Đọc từng chữ: \"S-L-A\" /ˌes.elˈeɪ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Thỏa thuận cam kết mức dịch vụ: Bản hợp đồng pháp lý cam kết giữa nhà cung cấp dịch vụ và khách hàng về độ sẵn sàng (Uptime). Nếu vi phạm, nhà cung cấp phải bồi thường tiền phạt hoặc credit.",
    "productionTip": "Luôn đặt SLA lỏng hơn SLO nội bộ (ví dụ: Cam kết khách hàng SLA 99.5%, nhưng team kỹ thuật hướng tới SLO 99.9%) để có vùng đệm an toàn."
  },
  {
    "id": "slo",
    "acronym": "SLO",
    "fullForm": "Service Level Objective",
    "pronunciation": "Đọc từng chữ: \"S-L-O\" /ˌes.elˈoʊ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Mục tiêu mức dịch vụ: Chỉ tiêu định lượng nội bộ mà đội ngũ kỹ thuật tự đặt ra để đo lường độ tin cậy của hệ thống (ví dụ: 99.9% request hoàn thành dưới 200ms trong 30 ngày).",
    "productionTip": "SLO xác định trực tiếp \"Error Budget\" (Ngân sách lỗi). Nếu còn Error Budget, team tự do deploy tính năng mới; nếu cạn Error Budget, team đóng băng release để sửa lỗi hạ tầng."
  },
  {
    "id": "sli",
    "acronym": "SLI",
    "fullForm": "Service Level Indicator",
    "pronunciation": "Đọc từng chữ: \"S-L-I\" /ˌes.elˈaɪ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Chỉ số mức dịch vụ: Thước đo định lượng trực tiếp từ hệ thống viễn trắc (Telemetry) phản ánh tình trạng hoạt động thực tế tại thời điểm hiện tại (ví dụ: tỷ lệ request trả về HTTP 2xx / tổng request).",
    "productionTip": "Mối quan hệ: SLI là số liệu bạn đo được; SLO là mục tiêu bạn phấn đấu đạt; SLA là lời hứa với khách hàng có kèm tiền phạt."
  },
  {
    "id": "k8s",
    "acronym": "K8s",
    "fullForm": "Kubernetes",
    "pronunciation": "Đọc là \"Cát-s\" /ˈkeɪts/ (Chữ \"K\" + 8 chữ cái ở giữa + chữ \"s\")",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Hệ thống điều phối container mã nguồn mở hàng đầu: Tự động hóa việc triển khai, mở rộng quy mô, tự phục hồi khi có sự cố và quản lý mạng cho hàng nghìn ứng dụng đóng gói container.",
    "productionTip": "K8s hoạt động theo cơ chế Vòng lặp đối soát (Reconciliation Loop): Lập trình viên khai báo trạng thái mong muốn (Desired State); Controller liên tục điều chỉnh thực tế để đạt đúng trạng thái đó."
  },
  {
    "id": "hpa",
    "acronym": "HPA",
    "fullForm": "Horizontal Pod Autoscaler",
    "pronunciation": "Đọc từng chữ: \"H-P-A\" /ˌeɪtʃ.piːˈeɪ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Bộ tự động co giãn Pod theo chiều ngang trong Kubernetes: Tự động tăng hoặc giảm số lượng bản sao Pods dựa trên mức sử dụng CPU/RAM hoặc các custom metrics từ Prometheus.",
    "productionTip": "Luôn cấu hình thời gian chờ giảm tải (Scale-down cooldown period, ví dụ 5 phút) để tránh hiện tượng HPA Thrashing (liên tục co giãn thất thường)."
  },
  {
    "id": "rto",
    "acronym": "RTO",
    "fullForm": "Recovery Time Objective",
    "pronunciation": "Đọc từng chữ: \"R-T-O\" /ˌɑːr.tiːˈoʊ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Thời gian phục hồi mục tiêu: Khoảng thời gian tối đa được phép trôi qua từ khi xảy ra sự cố thảm họa cho đến khi toàn bộ hệ thống dịch vụ được khôi phục hoạt động trở lại bình thường.",
    "productionTip": "RTO đo lường THỜI GIAN DOWNTIME mà doanh nghiệp có thể chấp nhận được trước khi chịu tổn thất tài chính nghiêm trọng."
  },
  {
    "id": "rpo",
    "acronym": "RPO",
    "fullForm": "Recovery Point Objective",
    "pronunciation": "Đọc từng chữ: \"R-P-O\" /ˌɑːr.piːˈoʊ/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Điểm phục hồi mục tiêu: Lượng dữ liệu tối đa tính theo đơn vị thời gian có thể bị mất mát khi thảm họa xảy ra (phụ thuộc vào tần suất sao lưu dữ liệu).",
    "productionTip": "Nếu backup database 24 giờ một lần thì RPO = 24 giờ (mất dữ liệu của cả ngày). Muốn RPO gần bằng 0 (Zero Data Loss), bắt buộc phải có cơ chế đồng bộ replication liên tục."
  },
  {
    "id": "mttr",
    "acronym": "MTTR",
    "fullForm": "Mean Time To Recovery / Mean Time To Resolve",
    "pronunciation": "Đọc từng chữ: \"M-T-T-R\" /ˌem.tiː.tiːˈɑːr/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Thời gian trung bình để khắc phục sự cố: Chỉ số đo lường năng lực của đội ngũ kỹ thuật trong việc phát hiện, khoanh vùng và khôi phục hệ thống kể từ khi sự cố xảy ra.",
    "productionTip": "Là 1 trong 4 chỉ số vàng của DORA Metrics (DevOps Research and Assessment) để đánh giá năng lực của một tổ chức kỹ thuật hàng đầu thế giới."
  },
  {
    "id": "saas",
    "acronym": "SaaS",
    "fullForm": "Software as a Service",
    "pronunciation": "Đọc là \"Sát-s\" /sæs/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Phần mềm dưới dạng dịch vụ: Khách hàng sử dụng ứng dụng hoàn chỉnh qua trình duyệt web trên nền tảng đám mây mà không cần cài đặt hay quản lý bất kỳ phần cứng hay hạ tầng nào (Google Workspace, Slack, Jira).",
    "productionTip": "Nhà cung cấp chịu trách nhiệm toàn bộ: Từ phần cứng, mạng, OS, runtime, dữ liệu cho đến ứng dụng người dùng cuối."
  },
  {
    "id": "paas",
    "acronym": "PaaS",
    "fullForm": "Platform as a Service",
    "pronunciation": "Đọc là \"Pát-s\" /pæs/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Nền tảng dưới dạng dịch vụ: Cung cấp môi trường runtime, database và công cụ phát hành để lập trình viên chỉ cần tập trung viết code và deploy mà không cần quản lý máy chủ hay OS (Heroku, Vercel).",
    "productionTip": "Lập trình viên chỉ quản lý ứng dụng và dữ liệu; nhà cung cấp quản lý runtime, middleware, OS, virtualization và phần cứng."
  },
  {
    "id": "iaas",
    "acronym": "IaaS",
    "fullForm": "Infrastructure as Service",
    "pronunciation": "Đọc là \"Ai-át-s\" /ˈaɪ.æs/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Cơ sở hạ tầng dưới dạng dịch vụ: Cung cấp tài nguyên điện toán cơ bản nhất gồm máy ảo, mạng ảo, tường lửa và lưu trữ đĩa (AWS EC2, Google Compute Engine, Azure VMs).",
    "productionTip": "Khách hàng có toàn quyền kiểm soát hệ điều hành, cài đặt phần mềm và cấu hình bảo mật, đổi lại phải tự chịu trách nhiệm vá lỗi OS và bảo trì."
  },
  {
    "id": "faas",
    "acronym": "FaaS",
    "fullForm": "Function as a Service",
    "pronunciation": "Đọc là \"Phát-s\" /fæs/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Hàm dưới dạng dịch vụ (Serverless Computing): Lập trình viên chỉ cần viết các hàm xử lý logic độc lập (AWS Lambda, Cloud Functions); hệ thống tự động kích hoạt, co giãn theo request và chỉ tính tiền khi hàm chạy.",
    "productionTip": "Zero idle cost (chi phí bằng 0 khi không có người dùng), nhưng phải đối mặt với vấn đề Cold Start khi khởi động instance mới."
  },
  {
    "id": "cpu",
    "acronym": "CPU",
    "fullForm": "Central Processing Unit",
    "pronunciation": "Đọc từng chữ: \"C-P-U\" /ˌsiː.piːˈjuː/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Bộ vi xử lý trung tâm: Não bộ của máy tính thực thi các lệnh chương trình máy tính thông qua chu kỳ Fetch-Decode-Execute.",
    "productionTip": "Tối ưu CPU bound: Giữ số thread tính toán xấp xỉ số core CPU vật lý để tránh lãng phí chi phí context switch."
  },
  {
    "id": "gpu",
    "acronym": "GPU",
    "fullForm": "Graphics Processing Unit",
    "pronunciation": "Đọc từng chữ: \"G-P-U\" /ˌdʒiː.piːˈjuː/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Bộ xử lý đồ họa: Vi xử lý chuyên dụng có hàng nghìn core nhỏ chạy song song (SIMD), tối ưu cho đồ họa 3D, tính toán ma trận và huấn luyện mô hình AI/LLM.",
    "productionTip": "Khác với CPU (vài core lớn độ trễ thấp), GPU tối ưu hóa thông lượng (Throughput) cho các phép toán song song hàng loạt."
  },
  {
    "id": "ram",
    "acronym": "RAM",
    "fullForm": "Random Access Memory",
    "pronunciation": "Đọc là \"Ram\" /ræm/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Bộ nhớ truy xuất ngẫu nhiên: Bộ nhớ tạm thời tốc độ cao của máy tính, mất toàn bộ dữ liệu khi mất điện (Volatile Memory).",
    "productionTip": "Tốc độ truy xuất RAM (~50-100ns) nhanh hơn SSD (~10-50µs) hàng trăm lần, là nơi lưu trữ Redis và OS Page Cache."
  },
  {
    "id": "api",
    "acronym": "API",
    "fullForm": "Application Programming Interface",
    "pronunciation": "Đọc từng chữ: \"A-P-I\" /ˌeɪ.piːˈaɪ/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Giao diện lập trình ứng dụng: Tập hợp các quy tắc, giao thức và công cụ cho phép các phần mềm giao tiếp và trao đổi dữ liệu với nhau.",
    "productionTip": "Thiết kế API tốt cần có tính nhất quán (Consistency), tương thích ngược (Backward Compatibility), và tài liệu hóa tự động bằng OpenAPI/Swagger."
  },
  {
    "id": "sdk",
    "acronym": "SDK",
    "fullForm": "Software Development Kit",
    "pronunciation": "Đọc từng chữ: \"S-D-K\" /ˌes.diːˈkeɪ/",
    "category": "system-design",
    "categoryLabel": "System Design",
    "meaning": "Bộ công cụ phát triển phần mềm: Gói thư viện, trình biên dịch, tài liệu và mã mẫu giúp lập trình viên tích hợp dịch vụ bên thứ ba (AWS SDK, Stripe SDK).",
    "productionTip": "SDK bọc ngoài API HTTP để tự động xử lý serialization, retry logic, connection pooling và xác thực chữ ký cryptographic."
  },
  {
    "id": "cli",
    "acronym": "CLI",
    "fullForm": "Command-Line Interface",
    "pronunciation": "Đọc từng chữ: \"C-L-I\" /ˌsiː.elˈaɪ/",
    "category": "os-concurrency",
    "categoryLabel": "OS & Low-Level",
    "meaning": "Giao diện dòng lệnh: Phương thức tương tác với máy tính và phần mềm thông qua việc gõ các lệnh văn bản trên terminal (kubectl, git, aws-cli).",
    "productionTip": "CLI là nền tảng để tự động hóa các script DevOps và CI/CD pipelines không cần người can thiệp (Headless/Automated)."
  },
  {
    "id": "sql",
    "acronym": "SQL",
    "fullForm": "Structured Query Language",
    "pronunciation": "Đọc là \"Xi-quần\" /ˈsiː.kwəl/ (phổ biến tại Mỹ) hoặc từng chữ \"S-Q-L\"",
    "category": "database",
    "categoryLabel": "Databases",
    "meaning": "Ngôn ngữ truy vấn có cấu trúc chuẩn hóa dùng để quản trị và thao tác dữ liệu trong các hệ quản trị cơ sở dữ liệu quan hệ (RDBMS).",
    "productionTip": "SQL là ngôn ngữ khai báo (Declarative): Bạn nói cho database biết KẾT QUẢ bạn muốn gì, Optimizer tự quyết định CÁCH THỰC THI (Execution Plan)."
  },
  {
    "id": "dns",
    "acronym": "DNS",
    "fullForm": "Domain Name System",
    "pronunciation": "Đọc từng chữ: \"D-N-S\" /ˌdiː.enˈes/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Hệ thống phân giải tên miền: Danh bạ của Internet, chuyển đổi tên miền thân thiện (google.com) thành địa chỉ IP mà máy tính hiểu được (142.250.190.46).",
    "productionTip": "DNS Anycast và TTL định kỳ giúp định tuyến người dùng tới data center gần nhất và hỗ trợ chuyển đổi dự phòng khi thảm họa (Disaster Recovery)."
  },
  {
    "id": "http",
    "acronym": "HTTP / HTTPS",
    "fullForm": "Hypertext Transfer Protocol (Secure)",
    "pronunciation": "Đọc từng chữ: \"H-T-T-P\" /ˌeɪtʃ.tiː.tiːˈpiː/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Giao thức truyền tải siêu văn bản tầng ứng dụng: Nền tảng của World Wide Web; HTTPS bổ sung thêm lớp mã hóa TLS trên cổng 443.",
    "productionTip": "HTTP là phi trạng thái (Stateless); các phiên làm việc (Sessions) được duy trì thông qua Cookie hoặc Authorization Bearer Token."
  },
  {
    "id": "ssl",
    "acronym": "SSL",
    "fullForm": "Secure Sockets Layer",
    "pronunciation": "Đọc từng chữ: \"S-S-L\" /ˌes.esˈel/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Tiền thân cũ của TLS: Giao thức mã hóa mạng do Netscape phát triển (hiện đã bị khai tử và thay thế hoàn toàn bởi TLS 1.3).",
    "productionTip": "Người ta vẫn quen gọi là \"SSL Certificate\", nhưng thực tế mọi chứng chỉ hiện đại đều chạy trên giao thức chuẩn TLS 1.2 hoặc TLS 1.3."
  },
  {
    "id": "vpn",
    "acronym": "VPN",
    "fullForm": "Virtual Private Network",
    "pronunciation": "Đọc từng chữ: \"V-P-N\" /ˌviː.piːˈen/",
    "category": "networking",
    "categoryLabel": "Networking",
    "meaning": "Mạng riêng ảo: Thiết lập một đường hầm mã hóa an toàn (Encrypted Tunnel) qua mạng Internet công cộng để kết nối thiết bị với mạng nội bộ doanh nghiệp.",
    "productionTip": "WireGuard và OpenVPN là hai giao thức VPN mã nguồn mở hiện đại phổ biến nhất cho hiệu năng cao và bảo mật đường truyền."
  },
  {
    "id": "vpc",
    "acronym": "VPC",
    "fullForm": "Virtual Private Cloud",
    "pronunciation": "Đọc từng chữ: \"V-P-C\" /ˌviː.piːˈsiː/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Đám mây riêng ảo: Mạng ảo cô lập hoàn toàn trên nền tảng điện toán đám mây (AWS, GCP) dành riêng cho tài khoản của bạn, tự quản lý dải IP (CIDR), Subnet, Route Table.",
    "productionTip": "Luôn phân chia Private Subnet (chứa Database, Backend không có Public IP) và Public Subnet (chứa Load Balancer, NAT Gateway)."
  },
  {
    "id": "jpa",
    "acronym": "JPA",
    "fullForm": "Jakarta / Java Persistence API",
    "pronunciation": "Đọc từng chữ: \"J-P-A\" /ˌdʒeɪ.piːˈeɪ/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Đặc tả chuẩn Java cho quản lý dữ liệu quan hệ (ORM): Định nghĩa các interface và annotation (@Entity, @Table), trong khi Hibernate là implementation phổ biến nhất.",
    "productionTip": "Code phụ thuộc vào JPA interfaces giúp bạn có thể hoán đổi ORM provider mà không phải sửa lại toàn bộ mã nguồn nghiệp vụ."
  },
  {
    "id": "jdbc",
    "acronym": "JDBC",
    "fullForm": "Java Database Connectivity",
    "pronunciation": "Đọc từng chữ: \"J-D-B-C\" /ˌdʒeɪ.diː.biːˈsiː/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Tầng API cấp thấp của Java kết nối trực tiếp với cơ sở dữ liệu qua Driver: Thực thi các câu lệnh SQL thuần và đọc tập kết quả ResultSet.",
    "productionTip": "Mọi ORM cấp cao (Hibernate, MyBatis, Spring Data) bên dưới đều gọi JDBC Driver; tối ưu JDBC Fetch Size và PreparedStatement Batching giúp tăng tốc độ ghi hàng nghìn lần."
  },
  {
    "id": "aop",
    "acronym": "AOP",
    "fullForm": "Aspect-Oriented Programming",
    "pronunciation": "Đọc từng chữ: \"A-O-P\" /ˌeɪ.oʊˈpiː/",
    "category": "java-jvm",
    "categoryLabel": "Java & JVM",
    "meaning": "Lập trình hướng khía cạnh: Kỹ thuật tách biệt các mối quan tâm xuyên suốt (Cross-cutting Concerns) như Logging, Transaction Management (@Transactional), Security ra khỏi logic nghiệp vụ cốt lõi.",
    "productionTip": "Spring AOP sử dụng Dynamic Proxy (JDK Proxy hoặc CGLIB): Hãy cẩn thận khi gọi một method @Transactional từ một method khác trong cùng class, proxy sẽ bị bypass và transaction không hoạt động."
  },
  {
    "id": "aes",
    "acronym": "AES",
    "fullForm": "Advanced Encryption Standard",
    "pronunciation": "Đọc là \"A-E-S\" /ˌeɪ.iːˈes/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Tiêu chuẩn mã hóa đối xứng (Symmetric Encryption) bảo mật nhất thế giới: Sử dụng cùng 1 khóa bí mật cho cả mã hóa và giải mã (chuẩn AES-256-GCM).",
    "productionTip": "Hầu hết các CPU hiện đại đều có tập lệnh phần cứng AES-NI, cho phép mã hóa dữ liệu với tốc độ gigabytes trên mỗi giây gần như 0 overhead."
  },
  {
    "id": "rsa",
    "acronym": "RSA",
    "fullForm": "Rivest-Shamir-Adleman Algorithm",
    "pronunciation": "Đọc từng chữ: \"R-S-A\" /ˌɑːr.esˈeɪ/",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Thuật toán mã hóa bất đối xứng (Asymmetric Encryption) kinh điển dựa trên độ khó của việc phân tích một số nguyên khổng lồ thành tích các số nguyên tố.",
    "productionTip": "Sử dụng cặp khóa Public Key (chia sẻ công khai để mã hóa) và Private Key (giữ bí mật để giải mã); chuẩn bảo mật tối thiểu hiện nay là RSA 2048-bit hoặc 4096-bit."
  },
  {
    "id": "sha",
    "acronym": "SHA",
    "fullForm": "Secure Hash Algorithm",
    "pronunciation": "Đọc là \"Sa\" /ʃɑː/ hoặc từng chữ \"S-H-A\"",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Gia đình các thuật toán hàm băm mật mã học một chiều (SHA-256, SHA-512): Biến đổi dữ liệu đầu vào có độ dài bất kỳ thành một chuỗi băm cố định (ví dụ 256 bits).",
    "productionTip": "SHA-256 dùng để kiểm tra tính toàn vẹn file và chữ ký số. KHÔNG ĐƯỢC dùng SHA-256 để băm mật khẩu người dùng vì quá nhanh trước GPU; hãy dùng Argon2id hoặc bcrypt."
  },
  {
    "id": "otel",
    "acronym": "OTel",
    "fullForm": "OpenTelemetry",
    "pronunciation": "Đọc là \"Ô-ten\" /ˈoʊ.tel/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Chuẩn mở giám sát thống nhất toàn cầu (CNCF): Cung cấp bộ SDK và Collector chung để thu thập cả 3 trụ cột đo lường: Metrics, Logs và Distributed Traces.",
    "productionTip": "Sử dụng OTel giúp ứng dụng không bị phụ thuộc vào bất kỳ nhà cung cấp APM nào (Vendor Lock-in); bạn có thể trỏ dữ liệu sang Datadog, Prometheus hoặc Jaeger chỉ bằng file config."
  },
  {
    "id": "crd",
    "acronym": "CRD",
    "fullForm": "Custom Resource Definition",
    "pronunciation": "Đọc từng chữ: \"C-R-D\" /ˌsiː.ɑːrˈdiː/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Cơ chế mở rộng API của Kubernetes: Cho phép người dùng tự định nghĩa các loại tài nguyên mới (Custom Resources) bên cạnh các resource có sẵn như Pod, Service, Deployment.",
    "productionTip": "Là nền tảng của Kubernetes Operator Pattern: CRD định nghĩa trạng thái mong muốn, Operator Controller liên tục theo dõi và tự động hóa vận hành (Kafka Operator, Postgres Operator)."
  },
  {
    "id": "aws",
    "acronym": "AWS / GCP / Azure",
    "fullForm": "Amazon Web Services / Google Cloud Platform",
    "pronunciation": "Đọc từng chữ: \"A-W-S\" /ˌeɪ.dʌb.əl.juːˈes/",
    "category": "devops",
    "categoryLabel": "DevOps & Cloud",
    "meaning": "Các nhà cung cấp dịch vụ điện toán đám mây công cộng (Public Cloud Providers) hàng đầu thế giới với hàng trăm dịch vụ IaaS, PaaS, SaaS.",
    "productionTip": "Nắm vững các dịch vụ lõi: Compute (EC2), Storage (S3), Database (RDS/DynamoDB), Networking (VPC), Identity (IAM)."
  },
  {
    "id": "iam",
    "acronym": "IAM",
    "fullForm": "Identity and Access Management",
    "pronunciation": "Đọc là \"Ai-am\" /ˈaɪ.æm/ hoặc \"I-A-M\"",
    "category": "security",
    "categoryLabel": "Security",
    "meaning": "Hệ thống quản lý định danh và quyền truy cập trên Cloud: Kiểm soát chính xác AI (Users/Roles/Services) được phép thực hiện HÀNH ĐỘNG GÌ trên TÀI NGUYÊN NÀO.",
    "productionTip": "Nguyên tắc vàng: Không dùng tài khoản Root cho công việc hàng ngày; phân quyền dựa trên IAM Roles gắn vào service (Instance Profile) thay vì hardcode Access Key/Secret Key."
  }
];
