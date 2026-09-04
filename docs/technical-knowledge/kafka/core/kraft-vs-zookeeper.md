---
id: kraft-vs-zookeeper
title: "KRaft vs ZooKeeper: Kafka Metadata Architecture"
sidebar_label: KRaft vs ZooKeeper
description: Comprehensive guide comparing Apache Kafka's legacy ZooKeeper architecture with the modern KRaft (Kafka Raft) metadata mode — covering internal mechanics, failure scenarios, Strimzi Kubernetes deployment, migration strategies, and production deep dives for senior engineers.
tags:
  - kafka
  - architecture
  - kraft
  - zookeeper
  - distributed-systems
  - consensus
  - raft
  - system-design
  - devops
---

import KraftVsZookeeperDiagram from '@site/src/components/KraftVsZookeeperDiagram';

# KRaft vs ZooKeeper: Kafka Metadata Architecture & Consensus

**KRaft (Kafka Raft Metadata Mode - KIP-500)** là bước chuyển mình mang tính lịch sử của Apache Kafka khi loại bỏ hoàn toàn sự phụ thuộc vào Apache ZooKeeper, chuyển việc quản lý metadata sang mô hình đồng thuận dựa trên thuật toán **Raft** ngay trong lòng Kafka Broker, giúp hệ thống mở rộng tới hàng triệu Partition và phục hồi sự cố (**Failover**) gần như tức thì ($< 1\text{s}$).

<KraftVsZookeeperDiagram initialTab="architecture" />

---

## 1. Nỗi đau Quản trị Hạ tầng Kép (Dual-System Pain) của ZooKeeper

Trong suốt hơn một thập kỷ, Apache Kafka dựa vào **Apache ZooKeeper** như một dịch vụ phân tán độc lập bên ngoài để quản lý trạng thái cụm, đăng ký broker, bầu chọn Controller và lưu trữ danh sách phân vùng. 

Tuy nhiên, trên các môi trường Production quy mô lớn, kiến trúc này bộc lộ 3 điểm nghẽn nghiêm trọng:

```text
[ CƠ CHẾ CŨ: ZOOKEEPER QUORUM ]
┌────────────────────────────────┐         ┌────────────────────────────────┐
│      ZooKeeper Ensemble        │ ◄────── │      Active Controller         │ ──────► [ Kafka Brokers ]
│   (3 hoặc 5 ZK Nodes, ZAB)     │ (Nghẽn) │     (Đọc toàn bộ ZNode tree)   │ (RPC)   (Đẩy metadata)
└────────────────────────────────┘         └────────────────────────────────┘
```

1. **Hạ tầng cồng kềnh (Dual-system Management):** Bạn phải cài đặt, cấu hình, scale, vá lỗi bảo mật và giám sát 2 cụm phân tán riêng biệt song song: Cụm ZooKeeper (ZAB protocol) và Cụm Kafka Brokers.
2. **Nút thắt cổ chai về Metadata (Metadata Bottleneck):** Mọi thông tin về Topic, Partition, ACLs, Replica State đều nằm trên ZooKeeper ZNodes (`/brokers`, `/topics`, `/controller`). ZooKeeper watch notifications dễ bị bão hòa khi số lượng phân vùng vượt quá $\approx 200,000$.
3. **Độ trễ phục hồi sự cố quá lớn (Cold Failover Latency):** Khi node Active Controller bị sập hoặc restart, node Controller mới được bầu lên phải **quét và nạp lại toàn bộ cây ZNode khổng lồ từ ZooKeeper vào RAM** trước khi có thể xử lý bất kỳ yêu cầu nào. Với các cụm có từ $100,000$ đến $200,000$ Partitions, thời gian đóng băng cụm (Cluster Freeze) có thể kéo dài từ $30\text{ giây}$ đến cả nửa tiếng đồng hồ!

---

## 2. Bản chất: KRaft hoạt động như thế nào?

Thay vì lưu trữ metadata ở một dịch vụ bên ngoài, **KRaft biến chính Metadata thành một Topic nội bộ đặc biệt (`@metadata` hay `__cluster_metadata-0`)** được quản lý theo mô hình **Event Sourcing** và thuật toán đồng thuận **Raft**:

```text
[ CƠ CHẾ MỚI: KRAFT QUORUM ]
┌──────────────────────────────────────────────────────────────┐
│                    KAFKA METADATA QUORUM                     │
│  [ Active Controller (Leader) ] ──(Ghi log tức thì)──>       │
│         │                                                    │
│         ├──(Replicate @metadata Log)──> [ Standby Controller]│
│         └──(Replicate @metadata Log)──> [ Broker Pods ]      │
└──────────────────────────────────────────────────────────────┘
```

### 3 Thành phần Vận hành Cốt lõi của KRaft:

1. **Metadata Quorum (Raft Controllers):** Một nhóm nhỏ các node Kafka (thường là 3 hoặc 5 node) được chỉ định đóng vai trò **Controller**. Nhóm này bầu ra một **Active Controller (Leader)** bằng thuật toán Raft.
2. **Event-Sourced Metadata Log (`@metadata` Partition):** Mọi thay đổi trong cụm (tạo Topic, rebalance, cập nhật cấu hình, gán quyền ACL) được Active Controller ghi tuần tự vào một log nội bộ dạng append-only.
3. **Đồng bộ Thời gian thực (Zero-lookup Failover):**
   * Tất cả các Controller dự phòng (**Standby Controllers**) và các **Data Brokers** đều liên tục theo dõi (pull streaming) các bản ghi từ topic metadata này và lưu trữ một bản sao đầy đủ ngay trong **bộ nhớ RAM**.
   * **Kết quả:** Khi Active Controller bị sập, một Controller khác được bầu lên làm Leader và **sẵn sàng nhận việc trong chưa đầy $200\text{ms}$** mà không cần tốn thời gian nạp lại dữ liệu từ đĩa cứng!

---

## 3. KRaft Metadata Snapshots (`.checkpoint`)

Để ngăn chặn topic `__cluster_metadata` phình to vô hạn theo thời gian, KRaft định kỳ tạo các bản chụp bộ nhớ (**Metadata Snapshots**):
1. Active Controller tuần tự hóa (serialize) toàn bộ cây metadata trong RAM thành một tệp snapshot `.checkpoint`.
2. Khi một Broker mới gia nhập hoặc vừa khởi động lại, nó chỉ cần nạp tệp snapshot mới nhất vào RAM trong vài mili-giây, sau đó chỉ cần kéo (fetch) các bản ghi phát sinh sau thời điểm snapshot.

```bash
# Lệnh kiểm tra cấu trúc Snapshot Metadata của KRaft
kafka-metadata-shell.sh \
  --snapshot /var/lib/kafka/data/__cluster_metadata-0/00000000000100000-0000002468.checkpoint
```

---

## 4. Bảng So sánh Chuyên sâu: KRaft vs ZooKeeper

<KraftVsZookeeperDiagram initialTab="comparison" />

| Tiêu chí So sánh | ZooKeeper Mode (Đã bị loại bỏ trong Kafka 4.0) | KRaft Mode (Chuẩn Modern Kafka 3.3+) |
| :--- | :--- | :--- |
| **Kiến trúc Vận hành** | 2 hệ thống độc lập (ZooKeeper Cluster + Kafka Cluster) | **1 hệ thống duy nhất (Single Binary, Unified Process)** |
| **Thời gian Controller Failover** | $30\text{s} - 30\text{ phút}$ (phụ thuộc vào số lượng ZNodes) | **Dưới $1\text{ giây}$ ($< 200\text{ms}$)** |
| **Giới hạn số lượng Partition** | Thường nghẽn ở mức $\approx 200,000$ Partitions | **Mở rộng dễ dàng tới $> 1,000,000$ Partitions** |
| **Cơ chế Lan truyền Metadata** | Controller chủ động gửi RPC Push tới từng Broker | **Brokers liên tục Pull streaming deltas vào RAM** |
| **Quản trị Bảo mật & ACLs** | Phân tán giữa ZooKeeper ACLs và Kafka Authorizer | **Quản lý tập trung qua Kafka CLI và metadata log** |
| **Giao thức Đồng thuận** | ZAB (ZooKeeper Atomic Broadcast) | **Raft Consensus Protocol (KIP-500)** |

---

## 5. Thực chiến Triển khai KRaft trên Kubernetes (Strimzi Operator)

<KraftVsZookeeperDiagram initialTab="strimzi_k8s" />

Khi triển khai Apache Kafka trên Kubernetes bằng **Strimzi Kafka Operator**, kiến trúc chuẩn Production yêu cầu tách biệt thành hai `KafkaNodePool`:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaNodePool
metadata:
  name: controller-pool
  namespace: kafka
spec:
  replicas: 3
  roles:
    - controller # Đóng vai trò chuyên biệt trong KRaft Metadata Quorum
  storage:
    type: persistent-claim
    size: 20Gi   # Dung lượng nhỏ nhưng cần SSD/NVMe IOPS cao
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"
---
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaNodePool
metadata:
  name: broker-pool
  namespace: kafka
spec:
  replicas: 5
  roles:
    - broker     # Đóng vai trò Data Broker tiếp nhận traffic Producer/Consumer
  storage:
    type: persistent-claim
    size: 500Gi  # Dung lượng đĩa lớn phục vụ lưu trữ message logs
  resources:
    requests:
      cpu: "4"
      memory: "16Gi"
    limits:
      cpu: "8"
      memory: "32Gi"
---
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: production-cluster
  namespace: kafka
  annotations:
    strimzi.io/kraft: "enabled" # Bật chế độ KRaft
spec:
  kafka:
    version: 3.8.0
    metadataVersion: 3.8-IV0
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
```

---

## 6. Cạm bẫy (Pitfalls) Senior cần lưu ý khi vận hành Production

<KraftVsZookeeperDiagram initialTab="quorum_calc" />

### Bẫy 1: Tách biệt Role trên Production tải cao (Dedicated vs Combined Roles)
Kafka cho phép một node vừa đóng vai trò `broker` vừa làm `controller` (`process.roles=broker,controller`).
* **Môi trường Dev/Test:** Có thể dùng Combined Node để tiết kiệm chi phí máy ảo.
* **Môi trường Production tải cao:** **BẮT BUỘC PHẢI TÁCH RIÊNG Controller Nodes và Broker Nodes**.
  * Nếu một Broker bị nghẽn đĩa hoặc quá tải CPU do Producer gửi lượng lớn messages, tiến trình Java có thể bị giật lag GC.
  * Nếu node đó kiêm Controller, hiện tượng nghẽn I/O sẽ làm gián đoạn nhịp tim (**Heartbeat**) của Raft Quorum, dẫn đến hiện tượng rớt Leader liên tục và làm tê liệt toàn bộ cụm Kafka!

---

### Bẫy 2: Quy tắc Quorum $2F + 1$ và Bẫy Số chẵn Node
Nhóm Controller trong KRaft hoạt động theo nguyên lý biểu quyết đa số (Majority Vote):

$$\text{Tổng số Controllers} = 2F + 1 \quad \Longrightarrow \quad F = \left\lfloor \frac{N - 1}{2} \right\rfloor$$

* **Cụm 3 Controllers:** Chịu được $F = 1$ node sập. Đa số cần: $2$ phiếu.
* **Cụm 5 Controllers:** Chịu được $F = 2$ node sập. Đa số cần: $3$ phiếu.
* **Cảnh báo (Bẫy 2 hoặc 4 Controllers):**
  * Cấu hình 2 Controllers: Cần $2/2$ node sống ($F=0$). Chết 1 node là toàn cụm mất Quorum!
  * Cấu hình 4 Controllers: Cần $3/4$ node sống ($F=1$). Độ chịu lỗi ngang cụm 3 node, nhưng nguy cơ chia rẽ biểu quyết (Split-Vote) tăng gấp đôi!
  * **Quy tắc:** Luôn luôn cấu hình số lẻ ($3$ hoặc $5$ node). Đối với cụm Multi-AZ, triển khai 5 Controllers chia đều trên 3 Availability Zones ($2$ in AZ-A, $2$ in AZ-B, $1$ in AZ-C).

---

### Bẫy 3: Migration từ ZooKeeper sang KRaft
Quá trình chuyển đổi một cụm đang chạy trên ZooKeeper sang KRaft trên Production là một quy trình nhiều giai đoạn (KIP-866):
1. **Giai đoạn Dual-Write (Migration Mode):** Nâng cấp Kafka lên phiên bản hỗ trợ migration (Kafka 3.5+). Khởi động Controller Quorum KRaft ở chế độ phụ thuộc, cho phép Active Controller đồng bộ song song cả vào ZooKeeper lẫn `@metadata` log.
2. **Chuyển giao quyền điều khiển (Controller Failover):** Chuyển giao hoàn toàn quyền quản trị sang KRaft Controller.
3. **Ngắt kết nối ZooKeeper:** Khi tất cả brokers đã chuyển sang giao tiếp với KRaft, tháo gỡ ZooKeeper ra khỏi cấu hình.
* **Lưu ý:** Quá trình này **không thể đảo ngược (Irreversible)** một khi đã hoàn tất bước cuối cùng. Bắt buộc phải sao lưu toàn bộ ZNode trước khi kích hoạt.

---

## 7. Phân tích Kỹ thuật: Fencing Split-Brain bằng Leader Epoch

Một trong những câu hỏi phỏng vấn kinh điển: **"Làm sao KRaft chống được hiện tượng Split-Brain (2 Controllers cùng nghĩ mình là Leader)?"**

```text
[ Controller A (Cũ, bị Network Partition) ] ── (Gửi RPC cũ với Epoch = 5) ──┐
                                                                              │
                                                                              ▼
[ Data Broker ] ── (Kiểm tra Epoch: 6 > 5) ───────────────────────────► ❌ TỪ CHỐI (Fence Out)
                                                                              ▲
                                                                              │
[ Controller B (Mới được Quorum bầu, Epoch = 6) ] ── (RPC mới với Epoch = 6) ┘
                                                  ──► ✅ CHẤP THUẬN
```

1. Mỗi nhiệm kỳ Leader trong Raft đều gắn liền với một số nguyên đơn điệu tăng dần gọi là **`LeaderEpoch`** (tương đương `Term` trong Raft chuẩn).
2. Khi Controller A bị mất kết nối mạng (Network Partition), Quorum còn lại gồm các nodes sẽ bầu Controller B lên làm Leader mới và tăng `LeaderEpoch` từ 5 lên 6.
3. Nếu Controller A hồi phục và cố tình gửi lệnh cấu hình xuống các Data Broker với `Epoch = 5`:
   * Các Data Broker so sánh số `LeaderEpoch` trong RPC với epoch hiện tại mà chúng đã biết ($6$).
   * Broker sẽ lập tức **từ chối (Fence Out)** lệnh từ Controller A, ngăn chặn hoàn toàn nguy cơ ghi đè dữ liệu sai lệch.

---

## 8. Tổng kết & Câu hỏi Phỏng vấn Cấp cao

### Q1: Tại sao KRaft có thể mở rộng tới hàng triệu Partition trong khi ZooKeeper bị giới hạn ở 200,000?
* **Trả lời:** ZooKeeper sử dụng mô hình cây phân cấp trong bộ nhớ và cơ chế Watchers. Khi hàng trăm nghìn partition cùng thay đổi trạng thái, lượng Watch notifications gửi ồ ạt làm tê liệt CPU của Controller. Trong khi đó, KRaft xem metadata là một chuỗi sự kiện nhị phân tuần tự (Event Sourcing) trong topic nội bộ `@metadata`. Brokers trực tiếp kéo dữ liệu dạng stream, loại bỏ hoàn toàn bão RPC và giới hạn của Watchers.

### Q2: Điều gì xảy ra nếu 2 trên 3 node Controller trong KRaft bị sập?
* **Trả lời:** Nhóm Controller sẽ **mất Quorum** (chỉ còn $1/3$ node sống, không đủ đa số $2/3$). 
  * Lúc này, cụm Kafka sẽ **chuyển sang chế độ Read-Only đối với Metadata**: Người dùng không thể tạo mới Topic, không thể thay đổi cấu hình hay rebalance partition.
  * Tuy nhiên, các Data Broker vẫn tiếp tục phục vụ các kết nối Producer/Consumer trên các Topic hiện hữu bình thường dựa vào bản sao metadata sẵn có trong RAM của chúng.
