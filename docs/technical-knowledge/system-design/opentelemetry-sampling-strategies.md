---
id: opentelemetry-sampling-strategies
title: OpenTelemetry Sampling Strategies (Tail-based vs Head-based)
sidebar_label: OTel Sampling Strategies
description: Deep dive into Distributed Tracing Sampling Strategies with OpenTelemetry Collector, Tail-based vs Head-based sampling, Multi-Collector Load-Balancing, memory protection, and cloud storage cost optimization.
tags: [opentelemetry, distributed-tracing, system-design, observability, microservices, performance]
---

import OpenTelemetrySamplingDiagram from '@site/src/components/OpenTelemetrySamplingDiagram';

# Distributed Tracing Sampling Strategies: Tail-based vs Head-based with OpenTelemetry

**TL;DR:** Distributed Tracing Sampling Strategies (**Tail-based Sampling vs Head-based Sampling**) kết hợp với **OpenTelemetry Collector** là giải pháp kiến trúc sống còn giúp các hệ sinh thái Microservices tải cao (hàng chục nghìn đến hàng triệu request mỗi giây) thu thập được **$100\%$ các dấu vết lỗi (HTTP 5xx, Unhandled Exceptions)** và **yêu cầu trễ bất thường (High Latency p99/p99.9)** mà không làm nổ chi phí lưu trữ hạ tầng (Grafana Tempo, AWS X-Ray, Jaeger, Datadog).

---

## The Distributed Tracing Dilemma: The Storage Cost Trap

Khi triển khai Distributed Tracing cho hệ thống Microservices hiện đại (Spring Boot 3, Go, Node.js), rào cản kỹ thuật lớn nhất hiếm khi nằm ở việc sinh ra Trace ID hay truyền tải context `traceparent` (W3C TraceContext). Rào cản thực sự nằm ở **bài toán kinh tế và dung lượng lưu trữ (Data Volume & Cloud Storage Economics)**:

Giả sử một hệ thống E-commerce / FinTech xử lý **$10,000 \text{ req/s}$**:
* Mỗi request đi qua $8$ Microservices $\rightarrow$ sinh ra trung bình $8 \text{ Spans}$.
* Mỗi Span trung bình nặng khoảng $500 \text{ bytes}$ (gồm traceId, spanId, attributes, tags, SQL queries, HTTP headers, timestamps, baggage).
* Tốc độ sinh log tracing thô:
  $$\text{Dữ liệu mỗi giây} = 10,000 \times 8 \times 500 \text{ B} = 40 \text{ MB/s}$$
  $$\text{Dữ liệu mỗi ngày} = 40 \text{ MB/s} \times 86,400 \text{ s} \approx 3.45 \text{ TB/ngày}$$
  $$\text{Dữ liệu mỗi tháng} \approx 103.5 \text{ TB/tháng}$$

Nếu đẩy toàn bộ $100\%$ trace thô này lên các dịch vụ SaaS APM hoặc lưu trữ trên Block Storage (S3 / Cloud Storage / Grafana Tempo):
* Với chi phí APM thương mại trung bình **$\$0.10 - \$0.20 \text{ / GB}$ ingested**: Hóa đơn hàng tháng sẽ rơi vào khoảng **$\$10,000 - \$20,000 \text{ USD}$** chỉ riêng cho tracing!
* Nếu dùng Open-Source (Grafana Tempo / Jaeger trên ClickHouse / Cassandra): Cần duy trì cụm cluster hàng chục worker nodes, tốn hàng chục terabyte NVMe disk và CPU cho việc nén (compaction), indexing và query.

Để tiết kiệm chi phí, giải pháp phản xạ tự nhiên của các kỹ sư là cấu hình **Random Sampling (Head-based Probabilistic Sampling)** ở mức $1\%$. Nhưng điều này dẫn tới một nghịch lý tai hại: **Nghịch lý lấy mẫu mù (The Blind Sampling Paradox)**.

---

## Head-based vs Tail-based Sampling: Kiến Trúc & Bản Chất

Điểm khác biệt cốt lõi giữa hai phương pháp nằm ở **thời điểm và vị trí đưa ra quyết định**: *"Trace này có đáng được lưu trữ hay không?"*

### 1. Head-based Sampling (Quyết định mù từ vạch xuất phát)

* **Vị trí quyết định:** Diễn ra ngay tại service đầu tiên (Ingress Controller, API Gateway, hoặc root service) khi request vừa chạm vào hệ thống.
* **Cơ chế:** Dựa trên thuật toán băm hoặc ngẫu nhiên (e.g., `traceId.hashCode() % 100 < sampling_percentage`). Quyết định `sampled=true` hoặc `sampled=false` được mã hóa vào flag của header `traceparent` (`01` là sampled, `00` là not sampled) và truyền xuôi dòng tới tất cả các downstream services.
* **Ưu điểm:**
  - Cực kỳ nhẹ, chi phí CPU và RAM tại client SDK gần như bằng $0$.
  - Không cần duy trì trạng thái trung gian (stateless). Downstream service chỉ cần đọc cờ `sampled` từ header để quyết định có gửi span đi hay không.
* **Nhược điểm chí mạng:**
  - **Mù hoàn toàn về kết quả tương lai (Blind to Future Failures):** Tại thời điểm request vừa tới API Gateway, hệ thống **không thể biết trước** liệu request này $200\text{ms}$ sau đó có bị lỗi `HTTP 500` ở Payment Service, hay bị timeout $10\text{s}$ ở Database query hay không.
  - **Quy luật xác suất bỏ sót sự cố:** Nếu bạn lấy mẫu $1\%$ ($s = 0.01$), và hệ thống đang xảy ra lỗi bất thường với tỉ lệ $0.1\%$ traffic, xác suất để bạn bắt được một request lỗi cụ thể chỉ là:
    $$P(\text{bắt được lỗi}) = 0.01 \times 0.001 = 0.00001 = 0.001\%$$
    Khi khách hàng VIP khiếu nại giao dịch bị trừ tiền nhưng báo lỗi, SRE mở Grafana Tempo / Jaeger lên thì hoàn toàn **không có bất kỳ trace nào** được ghi nhận!

### 2. Tail-based Sampling (Quyết định thông minh sau khi hành trình kết thúc)

* **Vị trí quyết định:** Diễn ra tập trung tại **OpenTelemetry Collector Contrib** sau khi toàn bộ chuỗi Spans của một request đã được thực thi và gửi về.
* **Cơ chế:**
  1. Các Microservices client SDK gửi **$100\%$ Spans** về tầng Collector nội bộ qua giao thức OTLP/gRPC siêu nhẹ trong mạng LAN nội bộ Kubernetes.
  2. Collector giữ toàn bộ các Spans có cùng `traceId` trong một **In-memory Trace Buffer** trong khoảng thời gian chờ được định cấu hình (`decision_wait`, ví dụ $5\text{s} - 10\text{s}$).
  3. Khi hết thời gian `decision_wait` hoặc nhận được Span kết thúc, Collector chạy tập luật chính sách (Sampling Policies):
     - Có bất kỳ Span nào mang cờ `Status = ERROR` hoặc `HTTP Status >= 500`? $\rightarrow$ **GIỮ $100\%$**.
     - Tổng thời gian `duration` của toàn bộ Trace có vượt quá ngưỡng $2000\text{ms}$ (p99 latency outlier)? $\rightarrow$ **GIỮ $100\%$**.
     - Trace có chứa attribute nghiệp vụ quan trọng (ví dụ `user.tier == "enterprise"`, `payment.amount > 10000`)? $\rightarrow$ **GIỮ $100\%$**.
     - Nếu Trace hoàn toàn bình thường (HTTP 200, nhanh, không có lỗi): Chỉ lấy mẫu xác suất **$0.1\% - 1\%$** để phục vụ phân tích baseline, loại bỏ (DROP) $99\%$ còn lại.
* **Kết quả:** Giảm $90\% - 95\%$ dung lượng lưu trữ và chi phí APM, nhưng **giữ lại $100\%$ các dấu vết sự cố** giúp điều tra nguyên nhân gốc rễ (Root Cause Analysis - RCA) chính xác tuyệt đối.

---

## Interactive Architecture & Decision Flow Simulator

Khám phá luồng xử lý của OpenTelemetry Collector, bộ định tuyến Multi-Collector Hash Routing, cấu hình YAML thực chiến và công cụ tính toán ROI chi phí lưu trữ:

<OpenTelemetrySamplingDiagram initialTab="tail_vs_head" />

---

## Thực Chiến Cấu Hình OpenTelemetry Collector Contrib

Tail-based Sampling là tính năng của phiên bản mở rộng **OpenTelemetry Collector Contrib** (không có sẵn trong phiên bản Core tối giản). Cần triển khai image `otel/opentelemetry-collector-contrib` trên Kubernetes.

### Cấu hình Pipeline chuẩn Production (`otel-collector-config.yaml`)

Dưới đây là cấu hình hoàn chỉnh tích hợp bảo vệ bộ nhớ (`memory_limiter`), bộ lọc gom nhóm (`tail_sampling`), và gom batch tối ưu (`batch`):

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  # BẮT BUỘC: Đặt memory_limiter ở vị trí đầu tiên trong chuỗi processors
  # để bảo vệ Collector không bị OOM crash khi traffic đột biến
  memory_limiter:
    check_interval: 1s
    limit_percentage: 80
    spike_limit_percentage: 20

  # Bộ não Tail-based Sampling
  tail_sampling:
    decision_wait: 8s                  # Chờ 8 giây để thu thập đủ các Span phân tán của 1 Trace
    num_traces: 50000                  # Kích thước bộ đệm chứa tối đa 50,000 Trace đồng thời trong RAM
    expected_new_traces_per_sec: 2500  # Ước lượng throughput để Collector tối ưu hash table
    policies:
      # Policy 1: Giữ lại 100% các Trace có Span kết thúc với trạng thái ERROR
      - name: errors-policy
        type: status_code
        status_code: { status_codes: [ ERROR ] }

      # Policy 2: Giữ lại 100% các Trace có p99/outlier latency chạy chậm hơn 2000ms
      - name: high-latency-policy
        type: latency
        latency: { threshold_ms: 2000 }

      # Policy 3: Giữ lại 100% các lỗi HTTP 5xx từ thuộc tính http.status_code hoặc http.response.status_code
      - name: http-5xx-policy
        type: numeric_attribute
        numeric_attribute:
          key: "http.status_code"
          min_value: 500
          max_value: 599

      # Policy 4: Giữ lại 100% trace từ khách hàng VIP / Enterprise
      - name: vip-tenant-policy
        type: string_attribute
        string_attribute:
          key: "tenant.tier"
          values: [ "enterprise", "premium" ]
          enabled_regex_matching: false

      # Policy 5: Với toàn bộ traffic thành công (HTTP 200) bình thường còn lại, chỉ lấy mẫu xác suất 1%
      - name: baseline-probabilistic-policy
        type: probabilistic
        probabilistic: { sampling_percentage: 1.0 }

  # Gom các trace đã được duyệt thành batch để nén và ghi hiệu quả vào backend
  batch:
    send_batch_size: 8192
    timeout: 5s
    send_batch_max_size: 16384

exporters:
  otlp/tempo:
    endpoint: tempo-distributor.monitoring.svc.cluster.local:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, tail_sampling, batch]
      exporters: [otlp/tempo]
```

---

## 3 Cạm Bẫy Vận Hành Thực Chiến (Senior Operational Pitfalls)

Triển khai Tail-based Sampling trên giấy tờ rất đơn giản, nhưng khi vận hành trên hệ thống tải hàng chục nghìn RPS, có $3$ cạm bẫy chí mạng khiến hệ thống bị sập hoặc mất dữ liệu trace:

### 1. Bài Toán Phân Mảnh Trace Khi Scale Multi-Collector (The Split Trace Problem)

* **Hiện tượng:** Khi lưu lượng tracing vượt quá khả năng xử lý của 1 Pod Collector ($> 5,000 \text{ traces/s}$), bạn scale Kubernetes Deployment lên $10$ Pods Collector đứng sau một Kubernetes Service / Load Balancer (Round-Robin).
* **Hậu quả:** 
  - Microservice A gửi `Span A` (Root) tới `Collector Pod 1`.
  - Microservice B xử lý tiếp và gửi `Span B` (chứa lỗi `HTTP 500`) tới `Collector Pod 3`.
  - `Collector Pod 1` chỉ thấy `Span A` (thành công) $\rightarrow$ quyết định **DROP**!
  - `Collector Pod 3` nhận được `Span B`, nhưng do không có `Span A` (Root), trace bị đứt gãy thành "mồ côi" (orphan span) hoặc bị đánh giá sai lệch. Toàn bộ logic Tail-sampling phá sản!

```text
[ SAI LẦM: Round-Robin Load Balancing ]
Microservice A (Span A: 200 OK)  ───────> [ K8s Service LB ] ──> [ Collector Pod 1 ] (Chỉ thấy Span A -> DROP!)
Microservice B (Span B: 500 ERR) ───────> [ K8s Service LB ] ──> [ Collector Pod 2 ] (Thấy Span B nhưng thiếu Root!)
```

#### ✅ Giải pháp Kiến trúc: Two-Tier Collector với Load-Balancing Exporter

Xây dựng kiến trúc 2 tầng (Two-Tier Architecture):
1. **Tier 1 (Agent / Router Tier):** Chạy dưới dạng DaemonSet trên từng Node hoặc stateless Gateway. Tier 1 không thực hiện tail-sampling mà sử dụng `loadbalancing` exporter:
   - Đọc `trace_id` của từng incoming span.
   - Băm nhất quán (Consistent Hash Ring) theo công thức: $\text{Collector\_Index} = \text{hash}(\text{trace\_id}) \pmod N$.
   - Chuyển tiếp toàn bộ các Span có chung `trace_id` về duy nhất một Pod cụ thể ở Tier 2.
2. **Tier 2 (Tail-Sampling Tier):** Chạy StatefulSet hoặc Deployment các Collector có cấu hình `tail_sampling`. Tại đây, mỗi Pod Collector luôn nhận được **toàn bộ các Span trọn vẹn của một Trace**.

```yaml
# Tier 1 Router Collector YAML
exporters:
  loadbalancing:
    routing_key: "trace_id"
    protocol:
      otlp:
        tls:
          insecure: true
    resolver:
      dns:
        hostname: "otel-collector-tail-tier.monitoring.svc.cluster.local"
        port: 4317

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter]
      exporters: [loadbalancing]
```

---

### 2. Nguy Cơ Tràn Bộ Nhớ (OOMKilled) Khi Traffic Đột Biến

* **Bản chất:** Để đánh giá Tail-sampling, Collector phải giam giữ hàng chục nghìn Trace trong RAM suốt khoảng thời gian `decision_wait` ($8\text{s}$). 
* **Khi có sự cố (Outage / Retry Storm):**
  - Số lượng request tăng gấp 5 lần do client liên tục retry.
  - Số lượng Spans tích lũy trong RAM vượt quá giới hạn tài nguyên của Container.
  - Kubernetes OOM-killer lập tức gửi `SIGKILL (exit code 137)` kết liễu Collector Pod. Toàn bộ trace đang chờ trong bộ đệm bốc hơi hoàn toàn!
* **Biện pháp phòng ngừa bắt buộc:**
  1. **Luôn cấu hình `memory_limiter` processor:** Phải được khai báo là processor **đầu tiên** trong pipeline. Khi bộ nhớ đạt $80\%$ limit, `memory_limiter` sẽ chủ động drop bớt dữ liệu mới thay vì để toàn bộ Pod bị OOMKilled.
  2. **Tính toán dung lượng RAM cho Collector:**
     $$\text{RAM cần thiết} = (\text{New Traces/sec} \times \text{decision\_wait (s)} \times \text{Average Trace Size (KB)}) \times 2.5 \text{ (Headroom)}$$
     *Ví dụ:* $2,000 \text{ traces/s} \times 8\text{s} \times 4 \text{ KB} = 64 \text{ MB}$ raw data. Khi cộng thêm overhead của Go runtime và metadata struct, bạn cần cấp phát tối thiểu **$1.5\text{GB} - 2\text{GB}$ RAM limit** cho mỗi Collector Pod.

---

### 3. Vấn Đề Quyết Định Non Nớt Với Asynchronous / Long-Running Workflows

* **Kịch bản:**
  - Một user request kích hoạt một luồng xử lý bất đồng bộ (ví dụ: Spring `@Async`, Kafka Producer $\rightarrow$ Consumer, Saga Orchestrator).
  - Web service trả về `HTTP 202 Accepted` sau $50\text{ms}$.
  - Worker xử lý ngầm (chuyển đổi video, sinh báo cáo PDF) chạy mất $25\text{s}$ rồi mới bị lỗi OutOfMemory hoặc Database Connection Timeout.
* **Hậu quả nếu cấu hình `decision_wait: 8s`:**
  - Sau $8$ giây kể từ Span đầu tiên, Collector kiểm tra thấy Web service trả về 202 OK, không có lỗi gì $\rightarrow$ **Đưa ra quyết định DROP trace**!
  - Đến giây thứ $25$, Worker gửi Span lỗi về Collector, nhưng Trace đã bị xóa khỏi bộ đệm. Span lỗi này bị xem như một trace mới hoặc bị drop vì không tìm thấy context cha.
* **Cách khắc phục:**
  - Tách biệt rõ ràng giữa **Synchronous Traces** (REST/gRPC API) và **Asynchronous Messaging Traces** (Kafka/RabbitMQ/Temporal).
  - Sử dụng **OpenTelemetry Span Links** thay vì Parent-Child Spans cho các tác vụ async dài hạn: Request HTTP kết thúc với trace riêng, và Job async mang một trace riêng có chứa Link tham chiếu đến trace gốc.
  - Hoặc định tuyến các service async sang một OTel Collector pipeline riêng biệt có `decision_wait: 60s` và dung lượng RAM lớn hơn.

---

## Bảng So Sánh Quyết Định Kiến Trúc (Decision Matrix)

| Tiêu chí | Head-based Sampling (Random 1%) | Rate-Limiting Sampling | Tail-based Sampling (OTel Collector) |
| :--- | :--- | :--- | :--- |
| **Vị trí quyết định** | Root Service / Ingress Gateway | Root Service hoặc Collector | OTel Collector Tier 2 |
| **Độ phủ dấu vết lỗi (5xx)** | Thấp ($1\%$ xác suất) | Trung bình (Dễ hụt khi có error burst) | **Tuyệt đối ($100\%$)** |
| **Độ phủ Slow Queries (p99)** | Rất thấp (hầu như bị bỏ lỡ) | Trung bình | **Tuyệt đối ($100\%$)** |
| **Độ phức tạp hạ tầng** | Cực thấp (Chỉ cần cấu hình SDK) | Rất thấp | Trung bình - Cao (Cần 2-Tier Collector cluster) |
| **Chi phí lưu trữ Backend** | Cực rẻ | Cố định có thể dự đoán | **Tối ưu nhất theo giá trị (High ROI)** |
| **Rủi ro OOM Collector** | Không có | Rất thấp | Có (Cần `memory_limiter` & routing) |
| **Phù hợp nhất cho** | Ứng dụng nhỏ, chi phí tối thiểu | API public cần hạn chế throughput | **Hệ thống lớn, FinTech, E-commerce, Mission-Critical** |

---

## 3 Case Studies Thực Chiến (Production Outages & War Stories)

### Case Study 1: Sự Cố "Mù Tracing" Đợt Flash Sale Của Sàn Thương Mại Điện Tử

* **Bối cảnh:** Một sàn thương mại điện tử lớn cấu hình Head-based Probabilistic Sampling $2\%$ trên toàn bộ cụm Spring Boot Microservices để giảm tải cho cụm Jaeger Elasticsearch.
* **Sự cố:** Vào đợt Flash Sale 11/11, hàng trăm khách hàng VIP phàn nàn rằng họ đã nhập mã coupon hợp lệ nhưng hệ thống báo lỗi không thanh toán được. Đội ngũ SRE kiểm tra Prometheus thấy tỷ lệ lỗi của `CheckoutService` chỉ là $0.05\%$ (khoảng 150 requests lỗi trên tổng số 300,000 requests trong 10 phút).
* **Vấn đề:** Khi mở Jaeger để tìm Trace ID phục vụ điều tra, do lấy mẫu $2\%$, xác suất bắt được 150 request lỗi này gần như bằng 0. Trong suốt 2 giờ diễn ra sự cố, đội ngũ kỹ sư hoàn toàn "mù" dữ liệu trace, không biết lỗi xuất phát từ Redis coupon cache hay từ Payment gateway.
* **Giải pháp khắc phục:** Chuyển đổi toàn bộ cụm sang OpenTelemetry Collector với Tail-based Sampling. Thiết lập chính sách:
  ```yaml
  policies:
    - name: keep-errors
      type: status_code
      status_code: { status_codes: [ ERROR ] }
    - name: keep-checkout-service
      type: string_attribute
      string_attribute: { key: "service.name", values: [ "checkout-service" ] }
  ```
  Nhờ đó, $100\%$ các giao dịch lỗi được giữ lại trọn vẹn, giúp kỹ sư nhanh chóng phát hiện lỗi NullPointerException do định dạng chuỗi coupon mới của đối tác.

---

### Case Study 2: "Cơn Bão OOM" Khi OpenTelemetry Collector Gặp Sự Cố Database Outage

* **Bối cảnh:** Một ngân hàng số triển khai Tail-based Sampling với `decision_wait: 15s` trên cụm Kubernetes gồm 4 Pods OTel Collector Contrib (mỗi Pod cấp $2\text{GB}$ RAM).
* **Sự cố:** Cụm cơ sở dữ liệu PostgreSQL Primary gặp sự cố deadlock, khiến hàng nghìn kết nối từ các service bị treo. Thay vì hoàn tất trong $200\text{ms}$, toàn bộ các request đều kéo dài từ $10\text{s}$ đến $30\text{s}$.
* **Hậu quả:** 
  - Vì các trace không kết thúc và `decision_wait` được đặt tới $15\text{s}$, các Spans bị dồn ứ lại trong RAM của Collector với tốc độ khủng khiếp.
  - Collector không được cấu hình `memory_limiter`.
  - Cả 4 Pods OTel Collector lần lượt chạm ngưỡng $2\text{GB}$ RAM và bị Linux OOM-killer kết liễu (`Killed: 137`). Khi Pod khởi động lại, lượng Span tồn đọng ập vào tiếp tục khiến Pod crash-loop liên tục, làm tê liệt toàn bộ hạ tầng giám sát đúng vào thời điểm hệ thống đang gặp sự cố nghiêm trọng nhất!
* **Bài học rút ra:**
  1. Giảm `decision_wait` xuống mức tối ưu: $6\text{s} - 8\text{s}$ cho các synchronous API.
  2. Bắt buộc kích hoạt `memory_limiter` processor với `limit_percentage: 75` và `spike_limit_percentage: 20`.
  3. Cấu hình Pod Horizontal Pod Autoscaler (HPA) cho Collector dựa trên chỉ số `otelcol_processor_tail_sampling_count_traces`.

---

### Case Study 3: Vụ Án "Trace Bị Đứt Gãy" Do Load Balancer Thiếu Nhất Quán

* **Bối cảnh:** Đội ngũ Platform triển khai Tail-based Sampling trên Kubernetes với 6 Pods OTel Collector. Phía trước 6 Pods này là một `ClusterIP Service` mặc định của Kubernetes (chạy kube-proxy iptables round-robin).
* **Sự cố:** Sau khi triển khai, các kỹ sư phát hiện trên Grafana Tempo chỉ thấy các trace cụt lủn (chỉ có 1-2 spans) và tỷ lệ bắt được lỗi giảm tới $70\%$ so với tính toán lý thuyết.
* **Phân tích nguyên nhân:** 
  - Một user request qua Gateway gọi tới Service A, Service B, và Service C.
  - Gateway gửi Root Span tới `otel-collector-pod-0`.
  - Service A gửi Span A tới `otel-collector-pod-2`.
  - Service C (nơi xảy ra exception) gửi Span C tới `otel-collector-pod-5`.
  - Kết quả: `Pod 0` và `Pod 2` không thấy lỗi nên drop span. `Pod 5` thấy Span C có lỗi nhưng không có Root Span nên hiển thị một span mồ côi không có ngữ cảnh HTTP method/URL ban đầu.
* **Giải pháp khắc phục:** Triển khai tầng Gateway Collector với `loadbalancingexporter` định tuyến theo `routing_key: "trace_id"`. Mọi span có cùng Trace ID từ đó luôn luôn được gom về chính xác một Pod xử lý duy nhất.

---

## Tóm Tắt & Lộ Trình Triển Khai Cho Senior Engineer

1. **Giai đoạn 1 (Quick Win):** Giữ Head-based sampling ở mức $5\%$ trên client SDK để giảm tải ban đầu, nhưng triển khai OTel Collector ở biên để làm quen với OTLP protocol.
2. **Giai đoạn 2 (Production Tail-sampling):**
   - Triển khai **OpenTelemetry Collector Contrib** với `loadbalancingexporter` ở tầng biên (Tier 1).
   - Triển khai cụm StatefulSet Collector chạy `tail_sampling` ở tầng trong (Tier 2).
   - Cấu hình bắt buộc `memory_limiter` đầu pipeline.
3. **Giai đoạn 3 (Policy Tuning):**
   - Thiết lập bộ lọc: $100\%$ Error, $100\%$ Latency $> 2\text{s}$, $100\%$ VIP Tenants, và $0.5\% - 1\%$ baseline HTTP 200 OK.
   - Kết nối với Grafana Tempo / Jaeger và đo lường ROI chi phí lưu trữ hàng tháng.
