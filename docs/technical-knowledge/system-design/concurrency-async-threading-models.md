---
id: concurrency-async-threading-models
title: Concurrency, Asynchrony, Blocking & Threading Models — The Master Guide
sidebar_label: Concurrency, Async & Threading
description: A comprehensive architectural guide to Synchronous vs Asynchronous, Blocking vs Non-blocking (the 2x2 Matrix), Concurrency vs Parallelism, and Asynchronous vs Multi-threading execution models.
tags: [system-design, concurrency, parallelism, async, blocking, multithreading, event-loop, reactive, java, netty]
---

import AsyncConcurrencyModelsDiagram from '@site/src/components/AsyncConcurrencyModelsDiagram';

# Concurrency, Asynchrony, Blocking & Threading Models

**TL;DR:** Sự nhầm lẫn giữa **Sync vs Async**, **Blocking vs Non-blocking**, **Concurrency vs Parallelism**, và **Async vs Multi-threading** là một trong những nguyên nhân hàng đầu dẫn đến thiết kế kiến trúc sai lầm, rò rỉ thread (thread starvation) hoặc sập hệ thống (cascading failures) khi tải cao. Bốn cặp khái niệm này đại diện cho **bốn chiều không gian hoàn toàn độc lập**:

```text
┌─────────────────────────┬────────────────────────────────────────────────────────┐
│ Chiều Phân Tích         │ Câu Hỏi Cốt Lõi Được Trả Lời                           │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. Sync vs Async        │ "Bao giờ và bằng cách nào người gọi nhận được kết quả?"│
│ 2. Blocking vs Non-block│ "Thread gọi lệnh sẽ làm gì trong lúc chờ đợi dữ liệu?" │
│ 3. Concurrency vs Para  │ "Nhiều tác vụ được quản lý xen kẽ hay chạy cùng tích tắc?"│
│ 4. Async vs Multi-thread│ "Cần nhiều công nhân (threads) hay luồng thông báo rảnh tay?"│
└─────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 1. Interactive Architecture & Model Visualizer

Khám phá ma trận tương tác $2 \times 2$, dòng thời gian Time-slicing vs Multi-core, mô hình đơn luồng Async vs đa luồng Sync, và bộ máy gợi ý kiến trúc:

<AsyncConcurrencyModelsDiagram initialTab="matrix_2x2" />

---

## 2. Chiều 1: Synchronous vs Asynchronous (Cơ Chế Nhận Kết Quả)

Khái niệm **Sync vs Async** tập trung vào **giao thức thông báo và thời điểm người gọi (Caller) nhận được kết quả** từ người thực thi (Callee).

```text
[ SYNCHRONOUS ]
Caller ─── Gọi hàm fn() ───────────────> Callee
Caller ─── (Chờ đợi theo bước) ─────────> Callee đang xử lý...
Caller <── Nhận kết quả trực tiếp ────── Callee trả về

[ ASYNCHRONOUS ]
Caller ─── Gọi hàm fn_async() ──────────> Callee
Caller <── Nhận ngay Ticket/Future ───── Callee (Xác nhận đã nhận việc)
... Caller làm việc khác ...             Callee xử lý ngầm trong nền...
Caller <── Nhận Callback / Event ─────── Callee thông báo hoàn tất
```

### Synchronous (Đồng bộ)
* Người gọi phát lệnh và **không thể coi là hoàn tất** cho tới khi hàm được gọi trả về giá trị trực tiếp trên cùng một chuỗi điều khiển.
* Hai thực thể di chuyển **cùng nhịp bước (lockstep)**.
* *Ví dụ đời thực:* Bạn gọi điện thoại cho bạn bè. Bạn nói, bạn của bạn nghe và trả lời ngay trên cuộc gọi đó.

### Asynchronous (Bất đồng bộ)
* Người gọi phát lệnh và **nhận lại quyền điều khiển ngay lập tức**, kèm theo một "biên nhận" hoặc lời hứa kết quả trong tương lai (`Future`, `Promise`, `Mono`, `Task`).
* Kết quả thực sự được chuyển giao sau thông qua một trong 4 cơ chế:
  1. **Callback:** Hàm callback được truyền vào và sẽ được kích hoạt khi callee xong việc (`onSuccess(result)`).
  2. **Event / Message Bus:** Bắn một event lên bus (Kafka, RabbitMQ, EventEmitter) để bên quan tâm tự lắng nghe.
  3. **Promise / Future Pipeline:** Chuỗi xử lý `.thenApply().thenAccept()`.
  4. **Polling:** Người gọi định kỳ kiểm tra trạng thái của vé hẹn (`future.isDone()`).
* *Ví dụ đời thực:* Bạn gửi email hoặc tin nhắn SMS. Bạn bấm gửi xong là quay sang làm việc khác, không cần người nhận phải trả lời ngay tức khắc.

---

## 3. Chiều 2: Blocking vs Non-blocking (Trạng Thái Thread & CPU)

Khái niệm **Blocking vs Non-blocking** hoàn toàn độc lập với Sync/Async. Nó tập trung vào **trạng thái của Thread gọi lệnh** tại tầng hệ điều hành / runtime kernel:

```text
[ BLOCKING CALL ]
Thread (RUNNING) ─── read(fd) ──> Kernel: Chưa có dữ liệu
Thread chuyển sang trạng thái WAITING / BLOCKED (Bị gỡ khỏi CPU Core)
─── [ CPU rảnh chạy thread khác, nhưng RAM của Thread này vẫn bị giữ ] ───
Kernel: Dữ liệu mạng đã tới! ───> Đánh thức Thread ───> Thread (RUNNABLE)

[ NON-BLOCKING CALL ]
Thread (RUNNING) ─── read_nonblock(fd) ──> Kernel: Chưa có dữ liệu!
Kernel trả về ngay lập tức mã: EAGAIN / EWOULDBLOCK
Thread VẪN Ở TRẠNG THÁI RUNNABLE! Giữ quyền kiểm soát CPU để làm tác vụ khác.
```

### Blocking (Chặn / Khóa)
* Lời gọi hàm khiến OS Thread gọi lệnh rơi vào trạng thái ngủ (**BLOCKED / WAITING**).
* OS Scheduler gỡ thread ra khỏi CPU core, lưu registers vào bộ nhớ và chuyển CPU cho thread khác.
* **Hậu quả tài nguyên:** Mặc dù không tốn CPU, thread bị block vẫn chiếm dụng **Thread Stack RAM** (~1MB trên JVM 64-bit mặc định). Nếu có 10,000 kết nối cùng bị block, bạn mất 10GB RAM chỉ để... các thread nằm ngủ!

### Non-blocking (Không chặn)
* Lời gọi hàm trở về quyền điều khiển **ngay lập tức** cho thread gọi lệnh.
* Nếu dữ liệu chưa sẵn sàng, kernel trả về mã trạng thái báo hiệu (như `EWOULDBLOCK` trong Linux C, hoặc trả về $0$ byte đọc được trong Java NIO).
* Thread gọi lệnh **vẫn thức (RUNNABLE)** và có thể lập tức chuyển sang xử lý kết nối khác mà không tốn chi phí hoán đổi ngữ cảnh (Context Switching).

---

## 4. Ma Trận $2 \times 2$: Sự Kết Hợp Cốt Lõi

Khi kết hợp $2$ trục này lại, chúng ta có ma trận phân loại kinh điển trong Computer Science:

```text
                          CƠ CHẾ TRẢ KẾT QUẢ
                 Synchronous              Asynchronous
             ┌────────────────────────┬────────────────────────┐
    Blocking │ 1. Sync + Blocking     │ 3. Async + Blocking    │
             │   (Truyền thống BIO)   │   (Future.get(), epoll)│
TRẠNG THÁI   ├────────────────────────┼────────────────────────┤
    Non-     │ 2. Sync + Non-blocking │ 4. Async + Non-blocking│
    blocking │   (Busy Polling)       │   (Event Loop, io_uring│
             └────────────────────────┴────────────────────────┘
```

### 1. Synchronous + Blocking (Mô hình truyền thống BIO)
* **Khái niệm:** Bạn gọi hàm, thread của bạn dừng mọi hoạt động và ngủ đợi kết quả trả về trực tiếp.
* **Ví dụ thực tế:** Đến quầy cà phê gọi món, đứng chết trân tại quầy không nhúc nhích cho tới khi nhân viên đưa ly nước.
* **Code thực tế:** Standard Java `FileInputStream`, `Socket.getInputStream().read()`, truyền thống Spring MVC + JDBC.
  ```java
  // Thread của Tomcat bị treo cứng tại dòng này chờ database
  User user = userRepository.findById(userId); // Blocking + Synchronous
  ```

### 2. Synchronous + Non-blocking (Vòng lặp Polling / Busy-Wait)
* **Khái niệm:** Bạn gọi hàm và nhận được câu trả lời ngay "chưa có". Bạn không ngủ mà liên tục quay lại hỏi lại cho tới khi có dữ liệu.
* **Ví dụ thực tế:** Gọi cà phê, nhân viên bảo "chưa xong". Bạn không đi đâu cả mà cứ $3$ giây lại ghé vào quầy hỏi: *"Xong chưa anh? Xong chưa em?"*.
* **Code thực tế:** Socket cấu hình `O_NONBLOCK` trong vòng lặp:
  ```java
  socketChannel.configureBlocking(false);
  ByteBuffer buf = ByteBuffer.allocate(1024);
  // Polling liên tục - Thread ăn 100% CPU core chỉ để hỏi!
  while (socketChannel.read(buf) == 0) {
      // Busy-waiting... làm nóng máy nếu không có backoff
  }
  ```

### 3. Asynchronous + Blocking (Phản mẫu anti-pattern phổ biến)
* **Khái niệm:** Tác vụ được ném vào nền để chạy async và trả về vé hẹn (`Future`), nhưng ngay sau đó thread gọi lại gọi lệnh chặn để ép lấy kết quả! Hoặc lời gọi I/O multiplexing (`select()`, `epoll_wait()`) bản thân nó chặn thread để chờ có ít nhất 1 socket sẵn sàng.
* **Ví dụ thực tế:** Gọi cà phê, nhận thẻ rung (buzzer). Nhưng thay vì đi chỗ khác làm việc, bạn lại ngồi xuống bàn và dán chặt mắt vào thẻ rung, không làm gì khác cho tới khi nó kêu.
* **Code thực tế:** Lỗi kinh điển của lập trình viên Junior khi dùng `CompletableFuture`:
  ```java
  CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> callSlowApi());
  // PHÁ HỎNG HOÀN TOÀN TÍNH ASYNC: Thread bị treo ngủ ở đây!
  String result = future.get(); // hoặc future.join()
  ```

### 4. Asynchronous + Non-blocking (Cảnh giới tối ưu hiệu năng)
* **Khái niệm:** Bạn kích hoạt tác vụ và tiếp tục làm việc khác. Khi tác vụ hoàn tất ở tầng kernel (DMA I/O), kernel thông báo và runtime kích hoạt hàm callback để xử lý tiếp dữ liệu.
* **Ví dụ thực tế:** Gọi cà phê, nhận thẻ rung, ra bàn mở laptop code. Khi nước xong, phục vụ mang nước tới tận bàn cho bạn mà bạn không cần để ý.
* **Code thực tế:** Spring WebFlux / Project Reactor, Node.js, Netty:
  ```java
  webClient.get().uri("/orders/" + id)
      .retrieve()
      .bodyToMono(Order.class)
      .subscribe(order -> {
          // Hàm này chạy khi có dữ liệu đổ về, không thread nào bị block
          renderOrder(order);
      });
  ```

---

## 5. Chiều 3: Concurrency vs Parallelism (Cấu Trúc vs Thực Thi)

> *"Concurrency is about **dealing** with lots of things at once. Parallelism is about **doing** lots of things at once."* — Rob Pike

```text
[ CONCURRENCY: 1 Core duy nhất ]
Core 0: |── Task A ──| [Context Switch] |── Task B ──| [Context Switch] |── Task A ──|
        (Hai tác vụ xen kẽ nhau theo lát cắt thời gian - Interleaved Progress)

[ PARALLELISM: 2 Cores vật lý ]
Core 0: |───────────────────── Task A ─────────────────────| (Chạy liên tục)
Core 1: |───────────────────── Task B ─────────────────────| (Chạy cùng tích tắc)
```

| Tiêu Chí Phân Định | Concurrency (Đồng Thời) | Parallelism (Song Song) |
| :--- | :--- | :--- |
| **Bản chất** | **Cấu trúc chương trình** (Program Structure) | **Thực thi phần cứng** (Hardware Execution) |
| **Số lượng CPU Cores** | Chạy được trên **$1$ core duy nhất** (qua time-slicing). | Bắt buộc phải có **nhiều cores / processors vật lý**. |
| **Cơ chế** | Phân chia thời gian (Context Switching / Interleaving). | Nhiều phép tính diễn ra tại **cùng một chu kỳ clock**. |
| **Mục tiêu chính** | **Responsiveness & Throughput:** Không để hệ thống bị nghẽn vì một tác vụ I/O chậm. | **Speedup:** Rút ngắn thời gian xử lý các bài toán tính toán đồ sộ. |
| **Phù hợp nhất** | **I/O-bound tasks:** Database calls, HTTP APIs, file systems. | **CPU-bound tasks:** Render đồ họa, nén file zip, training AI model. |
| **Ví dụ công nghệ** | Node.js Event Loop, Java Virtual Threads, Go Goroutines. | Java `ForkJoinPool`, `list.parallelStream()`, GPU CUDA cores. |

---

## 6. Chiều 4: Asynchronous vs Multi-Threading (Sự Khác Biệt Sống Còn)

Một trong những sai lầm phổ biến nhất của kỹ sư backend là đồng nhất **Async** với **Multi-threading**. 

* **Multi-threading** là câu chuyện về **"Số lượng công nhân" (Resource Model)**: Hệ điều hành tạo ra nhiều thread để thực thi các dòng lệnh.
* **Asynchronous** là câu chuyện về **"Cách thức phân chia công việc" (Execution Model)**: Công nhân không đứng chờ việc thụ động mà luôn luôn nhận việc mới khi việc cũ đang chờ I/O.

### 1. Bằng chứng đanh thép: Single-Threaded Asynchronous
Có thể đạt được hàng chục nghìn kết nối mạng đồng thời mà **hoàn toàn không dùng đa luồng (Multi-threading)**:
* **Node.js, Redis, Nginx:** Chạy trên **$1$ Thread duy nhất**. 
* Cách thức hoạt động: Dùng cơ chế **I/O Multiplexing (`epoll` trên Linux, `kqueue` trên macOS)**. Khi một request gửi dữ liệu đến socket, kernel báo cho Event Loop biết để nhảy vào đọc. Xử lý xong $50\mu\text{s}$, nó lập tức nhảy sang socket khác.
* **Ưu điểm:** Không có tranh chấp bộ nhớ (Race condition), không cần Lock/Synchronized, không tốn RAM cho Thread stacks, không tốn CPU cho Context Switching.

### 2. Multi-Threaded nhưng hoàn toàn Synchronous Blocking
Ngược lại, bạn có thể có một hệ thống dùng hàng trăm thread nhưng lại **hoàn toàn không có tính Asynchronous**:
* **Spring Boot 2 / Apache Tomcat truyền thống:**
  - Cấu hình `server.tomcat.threads.max: 200`.
  - Khi có $200$ request đồng thời gọi tới endpoint mà bên trong có câu lệnh `Thread.sleep(2000)` hoặc SQL query chậm $2\text{s}$.
  - Toàn bộ $200$ threads bị **block ngủ cứng**. Request thứ $201$ gửi tới sẽ bị xếp hàng đợi trong queue hoặc trả về lỗi `504 Gateway Timeout`, dù CPU của server lúc đó đang rảnh rỗi ở mức $2\%$!

---

## 7. Bốn Thế Hệ Mô Hình Xử Lý (The Evolution of Threading Architectures)

```text
Thế hệ 1: Thread-per-request (Tomcat / BIO)
[Req 1] ──> [OS Thread 1 (1MB Stack)] ──> [DB Call (BLOCK NGỦ)]
[Req 2] ──> [OS Thread 2 (1MB Stack)] ──> [DB Call (BLOCK NGỦ)]
Limitation: Max ~200-500 threads trước khi cạn RAM / CPU thrashing.

Thế hệ 2: Single-threaded Event Loop (Node.js / Redis)
[Req 1, 2, 3... 10000] ──> [epoll socket queue] ──> [1 Single Event Loop Thread]
Limitation: Một hàm tính toán CPU nặng (vd băm bcrypt) sẽ làm đóng băng toàn bộ server!

Thế hệ 3: Multi-threaded Event Loop (Netty / WebFlux / Vert.x)
[Clients] ──> [N Event Loop Threads = CPU Cores] ──(CPU Tasks)──> [Worker Thread Pool]
Limitation: Code theo phong cách Reactive rất khó debug, stack trace bị đứt gãy.

Thế hệ 4: Virtual Threads / User-space Threads (Java 21 Loom / Go Goroutines)
[Req 1..1M] ──> [1,000,000 Virtual Threads] ──(Tự động mount/unmount)──> [N Carrier Threads]
Best of both worlds: Code tuần tự blocking dễ đọc nhưng đạt hiệu năng non-blocking!
```

---

## 8. Cạm Bẫy Vận Hành: "Blocking Driver Poisoning"

Trong các hệ sinh thái Reactive (Spring WebFlux, Node.js, Netty), lỗi kiến trúc nguy hiểm nhất được gọi là **Blocking Driver Poisoning**:

```text
[ Netty Event Loop Thread 0 ] ──> Xử lý Non-blocking HTTP
                                          │
                        (Vô tình gọi JDBC Blocking Driver!)
                                          ▼
                      [ Thread 0 BỊ TREO CỨNG CHỜ DATABASE ]
                                          │
                                          ▼
   [ TOÀN BỘ 2,000 KẾT NỐI KHÁC THUỘC EVENT LOOP 0 BỊ CHẾT ĐỨNG THEO! ]
```

* **Nguyên nhân:** Lập trình viên dùng Spring WebFlux nhưng lại `import org.springframework.data.jpa.repository` (dùng Hibernate/JDBC driver chuẩn của PostgreSQL/MySQL vốn là blocking socket).
* **Hậu quả:** Netty chỉ có số thread bằng số CPU cores (ví dụ máy 4 cores có 4 Event Loop threads). Chỉ cần $4$ request đồng thời gọi câu lệnh SQL chạy mất $3\text{s}$, **toàn bộ 4 threads của Netty bị khóa cứng**, website hoàn toàn không phản hồi bất kỳ ai, kể cả endpoint health check `/actuator/health`!
* **Biện pháp phòng ngừa:**
  1. Dùng **R2DBC** (Reactive Relational Database Connectivity) thay cho JDBC.
  2. Nếu bắt buộc phải dùng JDBC, phải bọc nó vào một bounded elastic thread pool riêng biệt:
     ```java
     Mono.fromCallable(() -> blockingJpaRepository.findById(id))
         .subscribeOn(Schedulers.boundedElastic()); // Cách ly sang thread pool khác
     ```
  3. Hoặc nâng cấp lên **Java 21 với Virtual Threads**, biến toàn bộ cuộc tranh cãi Reactive trở nên đơn giản.

---

## 9. Bảng Tổng Hợp So Sánh Toàn Diện

| Tiêu Chí | Sync + Blocking (BIO) | Async Non-blocking (Reactive / Netty) | Single-threaded Async (Node.js) | Virtual Threads (Java 21 Loom) |
| :--- | :--- | :--- | :--- | :--- |
| **Mô hình lập trình** | Tuần tự, imperative (dễ nhất) | Khai báo, functional streams | Callback / Async-Await | Tuần tự, imperative (dễ nhất) |
| **Chi phí RAM / kết nối** | ~1MB (OS Thread Stack) | ~1 - 2KB (Channel buffer) | ~1 - 2KB (Event handle) | ~1KB (Continuation object) |
| **Dung lượng kết nối** | Hàng trăm (200 - 500) | Hàng trăm nghìn (100k+) | Hàng chục nghìn (50k+) | Hàng triệu (1M+) |
| **Xử lý CPU-bound** | Tốt (Thread chạy trên core) | Cần đẩy sang Worker Pool | Kém (Làm đơ Event Loop) | Kém nếu không giới hạn parallelism |
| **Độ khó Debug / Profiling** | Dễ (Stack trace thẳng đuột) | Rất khó (Stack trace phân mảnh) | Trung bình | Dễ (Stack trace như thread thật) |

---

## 10. Frequently Asked Questions (Senior Interview Prep)

### Q1: Có thể có Concurrency mà không có Parallelism không?
> **Trả lời:** **Có.** Trên máy tính chỉ có $1$ CPU Core duy nhất, hệ điều hành dùng kỹ thuật Time-slicing để luân phiên chạy Task A trong $2\text{ms}$, rồi Task B trong $2\text{ms}$. Cả hai tác vụ cùng đang diễn ra (concurrency), nhưng tại bất kỳ thời điểm vật lý nào cũng chỉ có $1$ tác vụ được CPU xử lý, do đó không hề có parallelism.

### Q2: Có thể có Asynchronous mà không cần Multi-threading không?
> **Trả lời:** **Có.** Node.js, Redis, Nginx là những minh chứng điển hình. Chúng chỉ chạy trên $1$ Thread duy nhất nhưng vẫn xử lý bất đồng bộ hàng chục nghìn kết nối mạng nhờ cơ chế I/O Multiplexing (`epoll`/`kqueue`). Khi socket chưa có dữ liệu, CPU không chờ mà chuyển sang phục vụ socket khác.

### Q3: Tại sao gọi `Future.get()` lại bị coi là biến Async thành Blocking?
> **Trả lời:** Vì bản chất của `get()` là một blocking system call. Mặc dù tác vụ chạy ngầm trên một background thread, thread gọi lệnh (ví dụ request thread) bị treo cứng tại dòng lệnh `future.get()` cho tới khi background thread trả về kết quả. Điều này vô hiệu hóa lợi ích giải phóng tài nguyên của mô hình bất đồng bộ.

### Q4: Java 21 Virtual Threads giải quyết mâu thuẫn giữa Code Simplicity và High Concurrency như thế nào?
> **Trả lời:** Trước Java 21, muốn scale hàng trăm nghìn kết nối, lập trình viên buộc phải viết mã Reactive phức tạp (WebFlux/RxJava) để không block OS Thread. Virtual Threads giải quyết việc này ở tầng JVM: Lập trình viên vẫn viết code blocking tuần tự đơn giản (`thread-per-request`), nhưng khi code gặp thao tác I/O blocking, JVM tự động tháo gỡ (unmount) Virtual Thread ra khỏi Carrier OS Thread và gắn Virtual Thread khác vào chạy tiếp. Khi I/O hoàn tất, Virtual Thread được gắn lại (mount) để tiếp tục thực thi.
