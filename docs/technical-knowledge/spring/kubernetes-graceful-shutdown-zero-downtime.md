---
title: Kubernetes & Spring Boot 3.x — Zero-Downtime Graceful Shutdown
description: Comprehensive guide to eliminating transient 502 Bad Gateway and Connection Reset errors during rolling updates and HPA scale-in using Kubernetes Pod Termination Lifecycle, preStop hooks, and Spring Boot 3 graceful shutdown.
tags: [kubernetes, spring-boot, graceful-shutdown, zero-downtime, devops, production]
---

import KubernetesGracefulShutdownDiagram from '@site/src/components/KubernetesGracefulShutdownDiagram';

# Zero-Downtime Graceful Shutdown: Kubernetes & Spring Boot 3.x

**Zero-Downtime Graceful Shutdown trong Kubernetes với Spring Boot 3.x** là sự kết hợp chuẩn xác giữa **Vòng đời kết thúc Pod (Pod Termination Lifecycle)**, tín hiệu `SIGTERM`, `preStop` hook của Kubernetes và **cơ chế dừng mềm (Graceful Shutdown)** của Web Server nhúng (Tomcat, Jetty, Undertow), giải quyết dứt điểm các lỗi `502 Bad Gateway` hoặc `Connection Reset` chập chờn xuất hiện mỗi khi deploy phiên bản mới hoặc HPA scale-in.

---

## 1. Vấn đề thực tế: Ảo tưởng về Readiness & Liveness Probes

Khi triển khai Rolling Update cho ứng dụng Java Spring Boot trên Kubernetes, nhiều đội ngũ kỹ thuật tin rằng chỉ cần cấu hình đầy đủ `livenessProbe` và `readinessProbe` là hệ thống sẽ tự động đạt mức sẵn sàng $100\%$ không gián đoạn (Zero-Downtime).

Tuy nhiên, thực tế trên Production thường xuất hiện một lượng lỗi nhỏ nhưng dai dẳng: **Cứ mỗi lần CI/CD kích hoạt deploy bản mới hoặc Horizontal Pod Autoscaler (HPA) thu hẹp (scale-in) Pods, một loạt HTTP requests của khách hàng lại bị trả về mã lỗi `HTTP 502 Bad Gateway`, `504 Gateway Timeout`, hoặc `Connection Reset by Peer`**.

Nguyên nhân gốc rễ xuất phát từ sự **bất đồng bộ giữa hai luồng sự kiện phân tán** khi một Pod bị khai tử:
1. **Luồng Mạng Phân Tán (Network Data Plane):** Gỡ bỏ IP của Pod khỏi `EndpointSlice`, cập nhật Ingress Controller (Nginx, Envoy, ALB) và đồng bộ bảng định tuyến `iptables`/`IPVS` trên toàn bộ các Worker Nodes.
2. **Luồng Tiến Trình Pod (Node Kubelet):** Gửi tín hiệu `SIGTERM` vào Container để dừng tiến trình ứng dụng Java.

---

## 2. Bản chất: Cuộc đua trạng thái (Race Condition) khi Pod bị xóa

Khi K8s nhận lệnh xóa một Pod (`kubectl delete`, Rolling Update của Deployment, hoặc HPA Scale-In), hai chuỗi hành động sau diễn ra **hoàn toàn song song và độc lập**:

```text
[ LỆNH XÓA POD (kubectl delete / Rolling Update / HPA Scale-in) ]
         │
         ├──(Nhánh 1: Mạng phân tán)──> Cập nhật Endpoints ──> Cập nhật Ingress/Kube-Proxy/iptables (Mất 2-5 giây!)
         │
         └──(Nhánh 2: Tiến trình Pod) ──> Gửi SIGTERM ngay lập tức ──> Ứng dụng Java tắt Web Server (Mất vài trăm ms!)
```

### Điểm nghẽn gây lỗi 502:
* Phía Ingress Controller (Nginx, Traefik, AWS Load Balancer Controller) hoặc Kube-Proxy mất từ $1$ đến $5\text{ giây}$ để phát hiện thay đổi và cập nhật bảng định tuyến `iptables`/`IPVS` trên các Worker Nodes.
* Trong khi đó, ứng dụng Spring Boot vừa nhận được tín hiệu `SIGTERM` đã vội vã đóng listening socket của Tomcat ngay lập tức (chỉ mất $100\text{ms} - 300\text{ms}$).
* **Hậu quả:** Ingress vẫn tiếp tục gửi các HTTP requests mới vào một Pod đã đóng socket mạng, khiến Kernel gửi ngược gói tin `TCP RST` về Ingress, dẫn đến lỗi `502 Bad Gateway` cho phía Client.

<KubernetesGracefulShutdownDiagram initialTab="race" />

---

## 3. Giải pháp 2 lớp: Graceful Shutdown + Container `preStop` Hook

Để triệt tiêu hoàn toàn race condition này, chúng ta cần phối hợp đồng bộ cả tầng Application (Spring Boot) và tầng Orchestration (Kubernetes).

<KubernetesGracefulShutdownDiagram initialTab="lifecycle" />

### Lớp 1: Bật Graceful Shutdown trong Spring Boot (`application.yml`)

Từ Spring Boot 2.3+ (và hoàn thiện trong Spring Boot 3.x), framework đã hỗ trợ sẵn cơ chế ngắt êm dịu cho cả 4 embedded web servers (Tomcat, Jetty, Undertow, Reactor Netty):

```yaml
server:
  shutdown: graceful # Bật chế độ đóng mềm (Chờ các request đang chạy dở)

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s # Chờ tối đa 30s cho các in-flight requests xử lý xong
```

#### Cơ chế hoạt động của Graceful Shutdown trong Spring Boot:
1. **Ngừng nhận request mới:** Ngay khi nhận `SIGTERM`, Web Server (Tomcat) ngừng mở cổng nhận TCP connection mới (`acceptCount` socket bị đóng).
2. **Xử lý nốt In-flight requests:** Các request đã vào hàng đợi hoặc đang thực thi dở dang (ví dụ đang query Database, upload file) được tiếp tục chạy nốt trong khoảng thời gian tối đa `30s` (theo `timeout-per-shutdown-phase`).
3. **Đóng tài nguyên tuần tự:** Sau khi tất cả request dở dang hoàn tất, Spring Context mới kích hoạt hủy các Bean khác (đóng Database Connection Pool HikariCP, ngắt Kafka consumer) và thoát với Exit Code 0.

### Lớp 2: Trì hoãn gửi `SIGTERM` bằng `preStop` Hook trên K8s

Mặc dù Spring Boot đã bật graceful shutdown, nếu K8s gửi `SIGTERM` quá sớm, Tomcat sẽ từ chối kết nối mới ngay lập tức trong khi Ingress vẫn chưa kịp gỡ IP khỏi bảng định tuyến. 

Để giải quyết, ta chèn một lệnh `sleep` ngắn bằng Kubernetes `preStop` lifecycle hook:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  template:
    spec:
      # Tổng thời gian K8s cho phép Pod dọn dẹp trước khi cưỡng chế SIGKILL (Mặc định 30s)
      # Công thức: terminationGracePeriodSeconds > preStop sleep + timeout-per-shutdown-phase + buffer
      terminationGracePeriodSeconds: 45
      containers:
        - name: order-service-container
          image: order-service:v2.1.0
          lifecycle:
            preStop:
              exec:
                # Trì hoãn 10s để Ingress/Kube-proxy kịp cập nhật Endpoints và ngắt luồng traffic mới
                command: ["/bin/sh", "-c", "sleep 10"]
          ports:
            - containerPort: 8080
```

---

## 4. Trình tự ngắt kết nối hoàn hảo trên Production

Khi kết hợp cả hai cấu hình trên, chuỗi sự kiện diễn ra mượt mà theo đúng thứ tự thời gian:

| Mốc thời gian | Tầng Kubernetes | Tầng Ingress / Mạng | Tầng Tiến trình Spring Boot | Trạng thái Request Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **$t = 0\text{s}$** | Đánh dấu Pod `Terminating`. Kích hoạt `preStop` hook (`sleep 10`). | API Server thông báo gỡ Pod khỏi `EndpointSlice`. | Tiếp tục chạy `sleep 10` trong container; Tomcat vẫn nhận và xử lý request bình thường. | Request mới vẫn được xử lý $100\%$ không bị gián đoạn. |
| **$t = 2\text{s} - 3\text{s}$** | `preStop` hook vẫn đang đếm ngược (`sleep`). | Ingress Controller và `kube-proxy` đã cập nhật xong `iptables`/`IPVS`. Pod IP bị gỡ bỏ hoàn toàn. | Tiếp tục phục vụ các request cũ còn sót lại. | Mọi request mới đã được tự động chuyển hướng sang các Pod còn sống khác. |
| **$t = 10\text{s}$** | `preStop` kết thúc. Kubelet gửi tín hiệu `SIGTERM` vào Container. | Pod IP đã không còn tồn tại trong bất kỳ Ingress nào. | Spring Boot bắt tín hiệu `SIGTERM`, dừng nhận kết nối mới, kích hoạt Graceful Shutdown. | Không còn request mới nào trỏ tới Pod này nữa. |
| **$t = 10\text{s} - 25\text{s}$** | Chờ tiến trình tự thoát (`terminationGracePeriodSeconds` còn $35\text{s}$). | Không liên quan. | Tomcat xử lý nốt các in-flight requests đang dang dở (tối đa 30s). | Các request đang chạy dở hoàn thành và trả kết quả HTTP 200 thành công. |
| **$t = 25\text{s}$** | Nhận thấy container đã thoát với `Exit Code 0`. | Không liên quan. | Đóng HikariCP, đóng Kafka Consumer, hủy Spring Context và tắt hẳn. | **Tỷ lệ lỗi $0\%$ (Zero-Downtime).** |
| **$t = 45\text{s}$** | Hết hạn `terminationGracePeriodSeconds`. | Không liên quan. | Pod đã thoát từ giây thứ 25, **không bao giờ bị `SIGKILL`**. | Hoàn tất dọn dẹp tài nguyên. |

---

## 5. Cạm bẫy (Pitfalls) Senior cần lưu ý khi vận hành

<KubernetesGracefulShutdownDiagram initialTab="pid1" />

### Bẫy 1: Bẫy PID 1 trong Docker Container (Mất tín hiệu `SIGTERM`)

Một trong những nguyên nhân phổ biến nhất khiến Graceful Shutdown "không hoạt động" trên Kubernetes là do cấu hình `Dockerfile`:

* **Sai lầm (Shell Form):**
  ```dockerfile
  ENTRYPOINT java -jar /app.jar
  # hoặc: CMD java -jar /app.jar
  ```
  Khi dùng Shell Form, Docker sẽ khởi chạy cú pháp tương đương `/bin/sh -c "java -jar /app.jar"`. Lúc này, tiến trình `/bin/sh` nhận **PID 1**, còn tiến trình Java là tiến trình con (ví dụ PID 7).
  
  Theo chuẩn POSIX của Linux, **tiến trình mang PID 1 mặc định không chuyển tiếp (forward) các tín hiệu hệ thống như `SIGTERM` cho tiến trình con** trừ khi được lập trình rõ ràng.

  **Hậu quả:** Ứng dụng Java không hề biết K8s đang muốn tắt mình. Tomcat tiếp tục chạy bình thường cho đến khi hết `terminationGracePeriodSeconds` (45s) và bị Kubelet cưỡng chế hạ sát đột ngột bằng `SIGKILL` (`kill -9`). Mọi database transaction đang commit dở bị hủy bỏ!

* **Khắc phục chuẩn (Exec Form):**
  Luôn luôn khai báo `ENTRYPOINT` dưới dạng mảng JSON (Exec Form) để JVM trực tiếp nhận **PID 1**:
  ```dockerfile
  ENTRYPOINT ["java", "-jar", "/app.jar"]
  ```

* **Nếu bắt buộc phải chạy qua Shell Script:**
  Nếu bạn cần chạy script chuẩn bị môi trường trước khi khởi động Java, hãy dùng lệnh `exec` để tiến trình Java thay thế (replace) chính tiến trình shell đó:
  ```bash
  #!/bin/sh
  # Setup environment variables...
  exec java -jar /app.jar
  ```

---

<KubernetesGracefulShutdownDiagram initialTab="calculator" />

### Bẫy 2: Công thức tính `terminationGracePeriodSeconds`

Luôn đảm bảo nguyên tắc toán học sau khi khai báo thông số:

$$\text{terminationGracePeriodSeconds} > \text{preStop sleep duration} + \text{timeout-per-shutdown-phase} + \text{Buffer}$$

> [!WARNING]
> **Ví dụ cấu hình sai lầm:**
> Giả sử bạn để mặc định `terminationGracePeriodSeconds = 30s`, trong khi đặt `preStop: sleep 10s` và Spring Boot `timeout-per-shutdown-phase: 30s` (tổng thời gian cần là $10 + 30 = 40\text{s}$).
>
> Sau $10\text{s}$ sleep, Spring Boot chỉ mới bắt đầu graceful shutdown được $20\text{s}$ thì đã chạm mốc $30\text{s}$ của K8s. Kubelet sẽ **bắn `SIGKILL` ngay lập tức**, bóp chết tiến trình Java khi đang xử lý nốt các database transactions cuối cùng!

**Khuyến nghị chuẩn Production:**
* `preStop sleep`: $10\text{s} - 15\text{s}$ (đủ cho Ingress và iptables toàn bộ cluster hội tụ).
* `timeout-per-shutdown-phase`: $25\text{s} - 30\text{s}$ (đủ cho $99.9\%$ HTTP requests hoàn tất).
* Buffer dọn dẹp JVM & HikariCP: $5\text{s}$.
* $\Rightarrow \mathbf{terminationGracePeriodSeconds} = 10 + 30 + 5 = \mathbf{45\text{s}}$ (hoặc $60\text{s}$ với các hệ thống tài chính/banking).

---

### Bẫy 3: Đóng các Async Workers (`@Async` & `ThreadPoolTaskExecutor`)

Mặc định, `server.shutdown: graceful` chỉ quản lý Web Server (Tomcat/Jetty). Nếu ứng dụng của bạn có các tác vụ bất đồng bộ `@Async` hoặc các thread pool background, K8s có thể tắt ứng dụng khi các thread này đang ghi dữ liệu dở dang.

Cần cấu hình rõ ràng cho Spring Task Executor:

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("AsyncWorker-");
        
        // Bật dừng mềm cho ThreadPool
        executor.setWaitForTasksToCompleteOnShutdown(true);
        // Chờ tối đa 20s cho các task trong queue chạy nốt
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }
}
```

---

### Bẫy 4: Kafka Listeners & Bảo toàn Offset Commit

Đối với các ứng dụng Spring Cloud Stream hoặc `spring-kafka`, khi Pod tắt đột ngột, Kafka Consumer có thể bị coi là "chết bất ngờ" (dead consumer), gây ra hiện tượng **Rebalance Storm** trên toàn bộ Kafka Consumer Group và làm duplicate messages do chưa kịp commit offset.

Cần cấu hình `shutdownTimeout` cho Kafka Listener Container:

```java
@Configuration
public class KafkaConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory(
            ConsumerFactory<String, Object> consumerFactory) {
        
        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        
        // Cấu hình thời gian chờ Kafka Consumer commit offset và dừng poll
        factory.getContainerProperties().setShutdownTimeout(15000); // 15 giây
        
        return factory;
    }
}
```

---

### Bẫy 5: Thứ tự giải phóng Database Connection Pool (HikariCP)

Một lỗi rất phổ biến khi bật graceful shutdown là: Tomcat vẫn đang xử lý request dở dang thì HikariCP đã ngắt kết nối Database, khiến request bị lỗi `SQLException: Connection is closed` hoặc `HikariPool - has been closed`.

Trong Spring Boot 3.x, các component tham gia vào vòng đời shutdown thông qua interface `SmartLifecycle` với các mức `phase` khác nhau:
* `WebServerGracefulShutdownLifecycle` có phase là `Integer.MAX_VALUE - 2048` (chạy đầu tiên khi tắt).
* DataSource / JPA Beans có phase mặc định là `0` (chạy sau cùng).

Nhờ cơ chế này, Spring Boot 3.x mặc định đảm bảo Web Server sẽ hoàn tất việc xử lý request trước khi DataSource bị hủy. Tuy nhiên, nếu bạn tạo các bean custom quản lý connection hoặc background scheduler, hãy luôn chỉ định `dependsOn` hoặc triển khai `SmartLifecycle` với phase phù hợp để không làm đứt kết nối Database giữa chừng.

---

## 6. Mẫu Cấu hình Hoàn chỉnh cho Production

### 1. `application.yml`
```yaml
server:
  port: 8080
  shutdown: graceful # Tomcat ngừng nhận kết nối mới, xử lý nốt in-flight

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s # Thời gian tối đa chờ in-flight requests

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      probes:
        enabled: true # Kích hoạt /actuator/health/liveness và /actuator/health/readiness
```

### 2. Kubernetes `deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  namespace: production
  labels:
    app: payment-service
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0 # Không bao giờ cho phép thiếu Pod khi deploy
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      # Công thức: 10s (preStop) + 30s (Spring shutdown) + 5s (buffer) = 45s
      terminationGracePeriodSeconds: 45
      containers:
        - name: payment-app
          image: registry.internal/payment-service:v3.2.1
          imagePullPolicy: IfNotPresent
          lifecycle:
            preStop:
              exec:
                # Đợi 10s để Ingress/Kube-proxy gỡ bỏ IP Pod khỏi bảng định tuyến
                command: ["/bin/sh", "-c", "sleep 10"]
          ports:
            - containerPort: 8080
              name: http
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 20
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
            failureThreshold: 2
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "2Gi"
```

### 3. Kiểm tra Log Graceful Shutdown trên K8s
Khi một Pod bị xóa, quan sát log bằng `kubectl logs -f <pod-name>` để kiểm chứng trình tự:

```text
2026-09-04 15:30:00.123 [main] INFO  o.s.b.w.e.t.GracefulShutdown - Commencing graceful shutdown. Waiting for active requests to complete
2026-09-04 15:30:04.567 [tomcat-handler-14] INFO  c.e.p.PaymentService - Transaction #98124 committed successfully
2026-09-04 15:30:05.890 [main] INFO  o.s.b.w.e.t.GracefulShutdown - Graceful shutdown complete
2026-09-04 15:30:05.912 [main] INFO  o.s.o.j.LocalContainerEntityManagerFactoryBean - Closing JPA EntityManagerFactory for persistence unit 'default'
2026-09-04 15:30:05.950 [main] INFO  com.zaxxer.hikari.HikariDataSource - HikariPool-1 - Shutdown initiated...
2026-09-04 15:30:06.015 [main] INFO  com.zaxxer.hikari.HikariDataSource - HikariPool-1 - Shutdown completed.
```

---

## 7. Tổng kết & Bảng kiểm tra trước khi Release

| Hạng mục kiểm tra | Cấu hình đề xuất | Mục đích |
| :--- | :--- | :--- |
| **Spring Server Shutdown** | `server.shutdown: graceful` | Cho phép Tomcat hoàn thành in-flight requests |
| **Spring Phase Timeout** | `spring.lifecycle.timeout-per-shutdown-phase: 30s` | Giới hạn thời gian tối đa cho in-flight requests |
| **K8s preStop Hook** | `command: ["/bin/sh", "-c", "sleep 10"]` | Cho Ingress/iptables 10s để gỡ bỏ Pod IP |
| **K8s Grace Period** | `terminationGracePeriodSeconds: 45` | Đảm bảo $T_{\text{grace}} > T_{\text{preStop}} + T_{\text{spring}}$ |
| **Dockerfile Form** | `ENTRYPOINT ["java", "-jar", "app.jar"]` | Tránh bẫy PID 1 nuốt tín hiệu `SIGTERM` |
| **Rolling Update Strategy** | `maxUnavailable: 0` | Đảm bảo luôn duy trì đủ số lượng Pod phục vụ traffic |
| **Async & Kafka Pools** | `setWaitForTasksToCompleteOnShutdown(true)` | Ngăn chặn đứt gãy tác vụ background và commit offset |
