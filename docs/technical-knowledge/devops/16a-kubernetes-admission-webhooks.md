---
id: kubernetes-admission-webhooks
title: Dynamic Admission Webhooks (Mutating & Validating)
sidebar_label: Admission Webhooks
description: Deep dive into Kubernetes Dynamic Admission Controllers — Mutating and Validating Webhooks, AdmissionReview JSONPatch RFC 6902, failurePolicy deadlock prevention, cert-manager TLS, and Policy-as-Code (Kyverno, OPA Gatekeeper).
tags: [kubernetes, admission-controllers, webhooks, security, devops, policy-as-code, advanced]
---

import KubernetesAdmissionWebhookDiagram from '@site/src/components/KubernetesAdmissionWebhookDiagram';

# Kubernetes Dynamic Admission Webhooks: Mutating & Validating Controllers

**Kubernetes Dynamic Admission Webhooks (Mutating & Validating Webhooks)** là "chốt chặn quyền lực" trong tầng Control Plane của Kubernetes, cho phép can thiệp, tự động sửa đổi manifest (Mutating) và thực thi các chính sách tuân thủ an toàn/bảo mật (Validating) đối với mọi tài nguyên trước khi chúng được ghi vào cơ sở dữ liệu `etcd`.

---

## 1. Vấn đề thực tế: Bài toán Quản trị Cụm Kubernetes ở Quy mô lớn

Khi một cụm Kubernetes mở rộng với hàng chục đội ngũ phát triển cùng liên tục deploy Pod lên các môi trường, câu hỏi hóc búa nhất của các kỹ sư Platform, SRE và Senior Backend là: **Làm sao để đảm bảo $100\%$ các workload tuân thủ đúng chuẩn Production mà không cần duyệt tay file YAML?**

### Các rủi ro thường gặp trên Production:
* **Quên cấu hình Resource Limits:** Developer quên khai báo `resources.limits`, khiến một Pod memory leak có thể ngốn sạch RAM của Worker Node, kéo theo các Pod lân cận bị Kernel Linux `OOMKilled`.
* **Kéo Image không rõ nguồn gốc:** Developer dùng tag `:latest` hoặc kéo image từ public Docker Hub thay vì Private Registry nội bộ của công ty.
* **Chạy Container dưới quyền Root:** Container chạy với `runAsUser: 0` (root), tiềm ẩn nguy cơ tấn công leo thang đặc quyền (Container Escape).
* **Nhu cầu tiêm tự động Sidecars:** Làm sao để tự động gắn Envoy Proxy (Istio Service Mesh), Vault Agent (để nạp Secret), hoặc OpenTelemetry Tracer vào Pod của Java Spring Boot mà không bắt từng developer phải tự sửa file Deployment thủ công?

Tất cả những bài toán này đều được giải quyết thông qua **Dynamic Admission Webhooks**.

<KubernetesAdmissionWebhookDiagram initialTab="lifecycle" />

---

## 2. Vòng đời Xử lý một Request trong Kubernetes API Server

Khi một lệnh `kubectl apply -f deployment.yaml` hoặc API call gửi tới `kube-apiserver`, request sẽ trải qua chuỗi 5 giai đoạn xử lý nghiêm ngặt trước khi được ghi vào `etcd`:

```text
[ CLIENT: kubectl apply -f manifest.yaml ]
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 1. Authentication (AuthN) & Authorization (AuthZ)   │ ──> Kiểm tra Client Cert/Token & quyền RBAC
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. Mutating Admission Webhooks (Chạy ĐẦU TIÊN!)     │ ──> Tự động sửa/thêm: Sidecars, Default Limits
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 3. Object Schema Validation                         │ ──> Kiểm tra cú pháp theo OpenAPI Schema
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 4. Validating Admission Webhooks (Chạy SAU CÙNG!)   │ ──> Đọc kiểm tra: Chặn :latest, chặn root (403)
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 5. Persisted to etcd                                │ ──> Ghi chính thức vào etcd, thông báo Scheduler
└─────────────────────────────────────────────────────┘
```

### Tại sao Mutating chạy trước và Validating chạy sau?
1. **Mutating Webhooks chạy ĐẦU TIÊN:** Vì chúng có quyền **chỉnh sửa (mutate / patch)** đối tượng. Ví dụ, nếu developer chưa cấu hình `resources.limits`, Mutating Webhook sẽ tự động chèn giá trị mặc định vào manifest.
2. **Schema Validation chạy Ở GIỮA:** Đảm bảo những gì mà Mutating Webhook vừa chỉnh sửa vẫn tuân thủ đúng định dạng OpenAPI của Kubernetes.
3. **Validating Webhooks chạy SAU CÙNG:** Là tầng kiểm tra **chỉ đọc (read-only)**. Chúng quan sát trạng thái *cuối cùng* của đối tượng (sau khi đã trải qua toàn bộ các bước mutate) để quyết định **Chấp thuận (Allow)** hoặc **Từ chối (Reject)**.

---

## 3. Giao thức Trao đổi: `AdmissionReview` & JSONPatch (RFC 6902)

Kubernetes API Server giao tiếp với Webhook Server qua giao thức **HTTPS**, gửi và nhận payload định dạng JSON theo schema `AdmissionReview` (`admission.k8s.io/v1`).

<KubernetesAdmissionWebhookDiagram initialTab="jsonpatch" />

### 1. Mutating Response (Sử dụng RFC 6902 JSONPatch)
Để biến đổi một đối tượng, Webhook Server trả về một mảng JSONPatch được mã hóa **Base64**:

```json
{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "uid": "705ab4f5-6393-11e8-b7cc-42010a800002",
    "allowed": true,
    "patchType": "JSONPatch",
    "patch": "W3sib3AiOiAiYWRkIiwgInBhdGgiOiAiL21ldGFkYXRhL2xhYmVscy9lbnYiLCAidmFsdWUiOiAicHJvZHVjdGlvbiJ9XQ=="
  }
}
```

*Chuỗi Base64 trên giải mã ra thao tác JSONPatch RFC 6902:*
```json
[
  {
    "op": "add",
    "path": "/metadata/labels/env",
    "value": "production"
  }
]
```

### 2. Validating Response (Từ chối Request với mã lỗi tùy chỉnh)
Khi một Pod vi phạm chính sách bảo mật, Webhook trả về `allowed: false` kèm mã trạng thái HTTP và thông báo lỗi hiển thị trực tiếp trên terminal của developer:

```json
{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "uid": "705ab4f5-6393-11e8-b7cc-42010a800002",
    "allowed": false,
    "status": {
      "code": 403,
      "message": "Error from server (Forbidden): Image 'nginx:latest' uses forbidden ':latest' tag! Tag must be explicit semver."
    }
  }
}
```

---

## 4. Thực chiến Khai báo Webhook Manifest trên Kubernetes

Để đăng ký một Webhook với Control Plane, bạn tạo tài nguyên `ValidatingWebhookConfiguration` hoặc `MutatingWebhookConfiguration`:

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: security-policy-validator
  annotations:
    # Tự động nạp CA Certificate từ cert-manager
    cert-manager.io/inject-ca-from: security-tools/webhook-cert
webhooks:
  - name: validate-pod-security.company.internal
    rules:
      - apiGroups: [""]
        apiVersions: ["v1"]
        operations: ["CREATE", "UPDATE"]
        resources: ["pods"]
        scope: "Namespaced"
    clientConfig:
      service:
        name: policy-validator-service
        namespace: security-tools
        path: "/validate-pods"
        port: 443
      # cert-manager sẽ tự động điền caBundle vào đây:
      caBundle: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0t...
    admissionReviewVersions: ["v1"]
    sideEffects: None
    timeoutSeconds: 3
    failurePolicy: Fail # Chặn request nếu webhook gặp lỗi
    namespaceSelector:
      matchExpressions:
        # CỰC KỲ QUAN TRỌNG: Loại trừ các namespace hệ thống để tránh cluster deadlock!
        - key: kubernetes.io/metadata.name
          operator: NotIn
          values: ["kube-system", "kube-public", "security-tools"]
```

---

## 5. Cạm bẫy (Pitfalls) Senior cần lưu ý khi vận hành Production

<KubernetesAdmissionWebhookDiagram initialTab="deadlock" />

### Bẫy 1: Thảm họa Deadlock Cụm khi cấu hình `failurePolicy: Fail`
Thuộc tính `failurePolicy` có hai giá trị:
* `Ignore`: Nếu Webhook Server bị sập hoặc timeout, API Server sẽ **bỏ qua** và vẫn cho phép tạo Pod.
* `Fail`: Nếu Webhook Server không phản hồi, API Server sẽ **chặn toàn bộ** các request tạo Pod.

> [!CAUTION]
> **Kịch bản Deadlock Sự Cố (Cluster Reboot Deadlock):**
> 1. Bạn cấu hình `failurePolicy: Fail` cho Webhook đánh chặn tài nguyên `Pod`.
> 2. Bản thân Pod của Webhook Server lại nằm trên chính cụm Kubernetes đó.
> 3. Cụm K8s gặp sự cố mất điện hoặc khởi động lại toàn bộ Worker Nodes (Cluster Reboot).
> 4. `kube-apiserver` khởi động và cần lập lịch tạo Pod cho chính Webhook Server.
> 5. Nhưng để tạo được Pod của Webhook Server, API Server lại phải gửi request đến Webhook Server để kiểm tra!
> 6. Vì Webhook Server chưa chạy $\to$ Request kiểm tra bị lỗi $\to$ `failurePolicy: Fail` chặn việc tạo Pod!
> 7. **Hậu quả:** Toàn bộ cụm K8s bị đóng băng (Deadlock) $100\%$, không một Pod nào có thể được tạo ra!

#### Giải pháp khắc phục chuẩn Senior:
1. **Luôn dùng `namespaceSelector`:** Loại trừ hoàn toàn namespace hệ thống (`kube-system`) và namespace chứa chính Webhook Server (`security-tools`).
2. **Cấu hình `objectSelector`:** Chỉ đánh chặn các Pod có gán nhãn cụ thể (Opt-in) thay vì chặn toàn bộ cụm.
3. **Triển khai Webhook Pod với độ sẵn sàng cao:** Chạy tối thiểu 3 replicas, cấu hình `PodDisruptionBudget` và Pod Anti-Affinity để phân bổ đều trên các Worker Nodes.

---

### Bẫy 2: Độ trễ Webhook (Latency) làm tê liệt CI/CD & HPA Autoscaling
Vì API Server phải chờ Webhook phản hồi đồng bộ qua HTTPS trước khi tiếp tục:
* Nếu Webhook Server xử lý chậm (ví dụ: query Database ngoài, gọi HTTP ra Internet, hoặc bị nghẽn mạng), mỗi lệnh `kubectl apply` sẽ mất vài giây.
* Nghiêm trọng hơn, khi cụm bị tăng tải đột biến (Spike Traffic), **Horizontal Pod Autoscaler (HPA)** hoặc KEDA cần scale nhanh từ 10 Pod lên 100 Pod. Việc mỗi Pod bị hoãn 3–5 giây do Webhook sẽ khiến hệ thống không kịp mở rộng và bị quá tải.
* **Quy tắc vàng:** Luôn đặt `timeoutSeconds: 3` (hoặc tối đa $2\text{s}$). Toàn bộ logic kiểm tra chính sách trong Webhook phải được thực hiện hoàn toàn **in-memory**, không gọi phụ thuộc mạng bên ngoài.

---

### Bẫy 3: Bắt buộc dùng TLS/HTTPS và chứng chỉ CA hợp lệ
Kubernetes API Server **từ chối tuyệt đối giao tiếp qua HTTP không mã hóa** với Admission Webhooks.
* Webhook Server bắt buộc phải cấu hình chứng chỉ TLS hợp lệ.
* Trong file `ValidatingWebhookConfiguration`, trường `caBundle` phải chứa chuỗi Base64 của CA Certificate đã ký cho chứng chỉ TLS của Webhook Server.
* **Giải pháp chuẩn:** Không tự tạo chứng chỉ thủ công; hãy cài đặt **cert-manager** trên cụm và sử dụng annotation `cert-manager.io/inject-ca-from` để tự động xoay vòng (auto-rotate) chứng chỉ và tự động inject `caBundle`.

---

### Bẫy 4: Vòng lặp Biến đổi Vô tận (Reinvocation Loops)
Khi bạn có nhiều Mutating Webhook:
* Webhook A sửa Pod $\to$ K8s phát hiện đối tượng bị thay đổi $\to$ K8s kích hoạt lại Webhook B $\to$ Webhook B lại sửa tiếp $\to$ K8s kích hoạt lại Webhook A...
* Để tránh tình trạng này:
  * Mọi logic Mutating Webhook phải có tính **Idempotent (Bất biến)**: Nếu một nhãn hoặc sidecar đã tồn tại, tuyệt đối không chèn thêm lần thứ hai.
  * Thiết lập `reinvocationPolicy: IfNeeded` một cách cẩn trọng.

---

## 6. So sánh: Tự viết Webhook (Go/Java) vs Policy-as-Code Engines (Kyverno / OPA)

<KubernetesAdmissionWebhookDiagram initialTab="engines" />

Thay vì phải tự viết và bảo trì một dịch vụ HTTP bằng Go hoặc Java Spring Boot (vốn tốn công sức quản lý container, TLS certificate, CI/CD pipeline), cộng đồng Kubernetes thường ưu tiên sử dụng các engine Policy-as-Code:

| Tiêu chí | Tự viết Webhook Server (Go / Java) | Kyverno (K8s Native) | OPA Gatekeeper (Open Policy Agent) |
| :--- | :--- | :--- | :--- |
| **Ngôn ngữ định nghĩa** | Code lập trình (Go, Java Spring Boot, Rust) | Kubernetes YAML CRD thuần túy | Ngôn ngữ chuyên dụng **Rego** |
| **Độ phức tạp vận hành** | **Cao:** Tự build image, cấu hình TLS, auto-scale, fix bug | **Rất thấp:** Cài đặt qua Helm, định nghĩa policy như file K8s YAML | **Trung bình:** Cần học cú pháp Rego và viết ConstraintTemplates |
| **Hỗ trợ Mutating** | Rất mạnh mẽ, tùy biến logic theo ý muốn | Hỗ trợ tuyệt vời qua cú pháp `mutate` trong YAML | Hỗ trợ Mutation nhưng cấu hình phức tạp hơn |
| **Khả năng sinh tài nguyên** | Tự code | Tự động sinh `generate` ConfigMap/Secret khi tạo Namespace | Không hỗ trợ |
| **Auditing & Report** | Tự lưu log | Tự động sinh `PolicyReport` CRD trực quan | Hỗ trợ Audit Controller quét định kỳ |
| **Khi nào nên dùng?** | Khi cần logic phức tạp (gọi DB nội bộ, tính toán hash động) | **Lựa chọn số 1** cho hầu hết các cụm K8s chuẩn doanh nghiệp | Doanh nghiệp đã dùng OPA cho đa nền tảng (Terraform, Envoy) |

---

## 7. Ví dụ Thực tế: Triển khai Policy với Kyverno (Không cần viết code)

Dưới đây là ví dụ triển khai chính sách cấm image tag `:latest` bằng Kyverno chỉ với một file YAML duy nhất:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Enforce # Hoặc 'Audit' để chỉ cảnh báo
  rules:
    - name: validate-image-tag
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Sử dụng tag ':latest' bị cấm trên môi trường Production. Vui lòng gắn tag phiên bản cụ thể!"
        pattern:
          spec:
            containers:
              - image: "!*:latest"
```

Khi developer chạy `kubectl apply` một Pod dùng image `nginx:latest`, Kyverno sẽ chặn đứng ngay tại API Server và trả về lỗi:

```text
Error from server: error when creating "pod.yaml": admission webhook "validate.kyverno.svc" denied the request: 
policy Pod/default/my-pod fail: validate-image-tag: Sử dụng tag ':latest' bị cấm trên môi trường Production. Vui lòng gắn tag phiên bản cụ thể!
```
