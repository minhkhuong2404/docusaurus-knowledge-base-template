---
id: mysql-indexing-beyond-equality
title: "MySQL Indexing Vượt Qua Dấu Bằng: ORDER BY, Range Scans, ICP & Deferred Joins"
description: "Chi tiết cơ chế đánh index MySQL nâng cao: phân biệt Seek vs Filter, quy tắc Leftmost Prefix, ESR rule, Index Condition Pushdown (ICP), Skip Scan, và kỹ thuật Deferred Join tăng tốc 148 lần."
tags: [database, mysql, indexing, b-tree, composite-index, icp, query-optimization, performance]
sidebar_position: 4
---

import MysqlIndexBeyondEqualityDiagram from '@site/src/components/MysqlIndexBeyondEqualityDiagram';

# MySQL Indexing Vượt Qua Dấu Bằng: ORDER BY, Điều Kiện Khoảng & Các Đường Vòng

Phần lớn kỹ sư backend sau vài năm làm việc đều đã từng tạo index, thấy câu query chạy nhanh hơn rõ rệt, và tin rằng mình đã "biết" đánh index. Tuy nhiên, khi bảng phình to lên hàng triệu đến hàng trăm triệu dòng, màn hình danh sách bắt đầu giật lag mất 5–10 giây. Phản xạ đầu tiên thường là nhìn vào mệnh đề `WHERE`, thấy có cột nào lọc thì tạo ngay một index đơn lẻ cho cột đó.

Vài tháng sau, một bảng tích tụ tới 10–15 index rời rạc, thao tác `INSERT`/`UPDATE` chậm đi trông thấy, dung lượng đĩa phình to, trong khi các câu query phức tạp vẫn chậm. Vấn đề không phải là bạn "chưa biết index", mà là bạn đang dừng lại ở **vùng an toàn của các điều kiện bằng (`=`)**. 

Thực tế production hiếm khi chỉ có dấu bằng. Các truy vấn thực chiến luôn đi kèm `ORDER BY`, điều kiện khoảng (`created_at >= ?`), tìm kiếm tiền tố (`LIKE 'abc%'`), phân trang sâu, và `SELECT *`.

---

## 1. Vấn đề thực tế: Câu hỏi cốt lõi của mọi Index

Mỗi khi phân tích một index trên một câu truy vấn cụ thể, câu hỏi đúng duy nhất bạn cần trả lời không phải là *"Index này có được dùng không?"* (câu hỏi này quá ngây thơ và nguy hiểm). Câu hỏi đúng ở cấp độ Senior/Lead là:

> **"Với index này, database SEEK (nhảy thẳng đến đúng điểm) được tới cột thứ mấy, và từ cột nào trở đi nó chỉ còn FILTER (đọc lướt từng dòng ra để so sánh)?"**

```
Index: (col_a, col_b, col_c)
Query: WHERE col_a = 10 AND col_b > 50 AND col_c = 'ACTIVE'

[col_a = 10]    ──> B-Tree SEEK (Nhảy thẳng đến phân vùng a = 10)
[col_b > 50]    ──> Range SEEK (Nhảy thẳng đến dòng đầu tiên b > 50)
[col_c = 'ACTIVE'] ──> FILTER (Không thể seek! Phải đọc lướt các lá để so sánh c)
```

### Giải mã câu query "vô vọng" trong thực tế

Hãy xem một câu query điển hình trong các màn hình tìm kiếm nâng cao / bộ lọc quản trị:

```sql
SELECT * FROM projects
WHERE tenant_uid     = ?
  AND transaction_to = ?
  AND valid_from     > ?
  AND valid_to       < ?
  AND name LIKE ?          -- '%keyword%'
  AND code LIKE ?          -- '%keyword%'
ORDER BY display_order, code
LIMIT 200;
```

Khi nhìn vào câu query này, phần lớn lập trình viên đều cảm thấy "vô vọng":
1. Hai điều kiện bằng (`tenant_uid`, `transaction_to`): Chỗ duy nhất có vẻ đánh index được.
2. Hai điều kiện khoảng (`valid_from > ?`, `valid_to < ?`): Chỉ có một trong hai cột khoảng được hưởng B-tree seek!
3. Hai điều kiện `LIKE '%...%'`: Wildcard đứng đầu khiến không một B-tree index nào có thể seek được.
4. `ORDER BY display_order, code`: Hai cột sắp xếp không liên quan gì đến các cột lọc phạm vi, nguy cơ dính `Using filesort` cực cao.
5. `SELECT *` kèm `LIMIT 200`: Mỗi bản ghi đi qua đều phải kéo toàn bộ các cột từ bảng chính lên RAM.

Nhiều người sẽ bỏ cuộc ở tầng database: đẩy sang Elasticsearch, Redis cache, hoặc ép nghiệp vụ bỏ bớt bộ lọc. **Nhưng câu query này hoàn toàn tối ưu được ngay trong MySQL**, dựa trên 4 trụ cột: thứ tự cột ESR, Index Condition Pushdown (ICP), Covering Index, và kỹ thuật **Deferred Join**.

---

## 2. Ba mức dùng Index: Seek vs Filter vs Scan

Để hiểu tại sao có câu query dùng index vẫn chậm, ta phải phân định rạch ròi 3 mức độ can thiệp của index:

<MysqlIndexBeyondEqualityDiagram initialTab="seek_filter" />

### Bảng phân cấp 3 mức độ thực thi:

| Mức độ | Thao tác vật lý | `EXPLAIN type` | Chi phí tương đối | Cơ chế hoạt động |
|---|---|---|---|---|
| **Mức 1: SEEK (Nhảy thẳng)** | B-Tree Root ➔ Leaf Point | `const`, `eq_ref`, `ref`, `range` (tiền tố) | **Rất rẻ ($O(\log N)$)** | B-Tree định vị thẳng tới node lá đầu tiên và dừng ngay khi hết cụm giá trị liên tục. |
| **Mức 2: FILTER (Đọc lướt)** | Sequential Leaf Scan / ICP | `range` (đuôi), `index`, `Using index condition` | **Trung bình ($O(M)$)** | Không thể nhảy điểm; database phải duyệt tuần tự các entry trong lá index để kiểm tra điều kiện. Vẫn nhanh hơn quét bảng vì kích thước entry nhỏ (vài chục byte). |
| **Mức 3: SCAN (Quét bảng)** | Clustered Table Scan | `ALL` | **Rất đắt ($O(N)$)** | Bỏ qua index hoàn toàn, đọc toàn bộ Data Pages từ đĩa hoặc Buffer Pool vào RAM. |

:::caution[Cảnh giác với EXPLAIN type: index]
Khi thấy `type: index` trong EXPLAIN, rất nhiều dev lầm tưởng rằng câu query đang chạy rất tối ưu vì thấy chữ "index". Thực chất, `type: index` là **Full Index Scan** — tức là nó duyệt từ đầu đến cuối toàn bộ cây index! Nó chỉ đỡ tệ hơn `type: ALL` vì file index nhẹ hơn file bảng, nhưng về bản chất nó vẫn là một vòng lặp quét trọn vẹn.
:::

---

## 3. Bản chất cơ học của Leftmost Prefix: Cuốn danh bạ và các dòng liền nhau

Quy tắc tiền tố trái (**Leftmost Prefix Rule**) thường bị hiểu nhầm là một "luật lệ cứng nhắc do các kỹ sư MySQL tự nghĩ ra". Thực tế, nó là **hệ quả vật lý bắt buộc của một danh sách đã được sắp xếp sẵn**.

Một Composite Index `(a, b)` trong InnoDB là **một cây B-Tree duy nhất với khóa ghép**, tương đương với một cuốn danh bạ điện thoại được in theo thứ tự `(Họ, Tên)`.

```
idx_shop_created (shop_id, created_at)

   (6, '2026-01-05')
   (6, '2026-02-11')
   (7, '2026-01-01') ──┐
   (7, '2026-01-02')   │ WHERE shop_id = 7
   (7, '2026-01-03')   │ ──> Mọi bản ghi khớp nằm LIỀN NHAU TUYỆT ĐỐI
   (7, '2026-01-04')   │ ──> Nhảy thẳng vào đầu cụm, đọc tới đuôi cụm = SEEK
   (7, '2026-01-05') ──┘
   (8, '2026-01-02')
   (9, '2026-01-02')
```

### Điều gì xảy ra khi query bỏ qua cột đầu tiên?

Nếu câu truy vấn là:
```sql
SELECT id FROM orders WHERE created_at = '2026-01-02';
```

Trong cuốn danh bạ điện thoại, câu này tương đương với: *"Hãy tìm tất cả những người có tên là An"*. Vì cuốn danh bạ sắp xếp theo Họ trước, những người tên "An" sẽ nằm rải rác: Nguyễn Văn An, Trần Hoàng An, Lê Quốc An... nằm ở trang 10, trang 150, trang 800!

```
idx_shop_created (shop_id, created_at)

   (6, '2026-01-05')
   (7, '2026-01-02')  <-- Khớp!
   (7, '2026-01-03')
   (8, '2026-01-02')  <-- Khớp!  (Các dòng cần tìm nằm RẢI RÁC)
   (9, '2026-01-02')  <-- Khớp!  (Không có cụm liền nhau để nhảy vào -> FILTER)
```

Không tồn tại bất kỳ điểm nào để B-Tree "nhảy thẳng" vào. Muốn không sót kết quả, database bắt buộc phải lật từng trang từ đầu đến cuối cuốn danh bạ (`type: index`).

---

## 4. Ảo tưởng mang tên LIMIT và Bản chất của FORCE INDEX

### 1. LIMIT không cứu được một Execution Plan tệ

Khi thấy câu query dính `type: ALL` (Table Scan), phản xạ của nhiều người là thêm `LIMIT 100` với hy vọng database chỉ đọc 100 dòng rồi dừng.

```sql
SELECT * FROM contacts WHERE first_name = 'An5' LIMIT 100;
```

Đo lường trên bảng 512,000 dòng:
* Kế hoạch thực thi: Vẫn là `type: ALL`.
* **Chi phí phụ thuộc hoàn toàn vào mật độ dữ liệu (Data Density):**
  * Nếu có 100,000 dòng thỏa mãn `first_name = 'An5'`, database chỉ cần quét vài trăm dòng đầu là đủ `LIMIT 100` $\to$ Chạy mất 0.5 ms.
  * Nếu dữ liệu thưa thớt (chỉ có 267 dòng thỏa mãn trên 512,000 dòng), database phải lội qua **gần 237,000 dòng dữ liệu** mới gom đủ 100 kết quả $\to$ Mất **143 ms**!
* **Bẫy môi trường dev:** Trên máy local với 500 dòng test, `LIMIT 100` chạy tức thì, khiến dev tin rằng query đã được tối ưu, nhưng khi lên production với dữ liệu thưa, hệ thống nghẽn CPU ngay lập tức.

### 2. Sự thật về FORCE INDEX: Ép được gì và không ép được gì?

Nhiều người nghĩ rằng `FORCE INDEX` là câu lệnh ra lệnh tuyệt đối: *"Bắt buộc database phải dùng index này"*. Thực tế:

<MysqlIndexBeyondEqualityDiagram initialTab="force_index" />

`FORCE INDEX` chỉ thực hiện đúng 2 hành động bên trong bộ tối ưu hóa (Query Optimizer):
1. **Cắt danh sách ứng viên:** Loại bỏ tất cả các index khác, chỉ giữ lại index được chỉ định.
2. **Đội chi phí Table Scan lên vô hạn:** Làm cho chi phí của `type: ALL` trở nên cực đắt để chắc chắn thua mọi phương án đi qua index còn sống sót.

:::danger[Khi nào FORCE INDEX hoàn toàn vô dụng?]
Table Scan là **phương án chót không thể xóa bỏ** (Fallback of last resort). Bất kỳ câu query nào cũng luôn có thể đọc tuần tự từ đầu đến cuối bảng. 

Do đó, nếu index bạn chỉ định **không thể cung cấp bất kỳ đường đi hợp lệ nào về mặt cấu trúc** (không seek được do thiếu tiền tố, không covering được do dính `SELECT *`), danh sách ứng viên qua index sẽ là **tập rỗng**. Khi đó, `FORCE INDEX` hoàn toàn bị bỏ qua, và MySQL lặng lẽ quay về quét toàn bộ bảng (`type: ALL`) mà không hề báo lỗi!
:::

```
"range_scan_alternatives": [
  { "index": "idx_name", "chosen": false, "cause": "no_valid_range_for_this_index" }
],
"skip_scan_range": [
  { "index": "idx_name", "usable": false, "cause": "query_references_nonkey_column" }
],
"access_type": "scan", "chosen": true
```

> **Quy tắc ghi nhớ:** *"FORCE INDEX là băng gạc, không phải thuốc trị bệnh. Dán được thì dán để cầm máu tạm thời trong sự cố production, nhưng sau đó bắt buộc phải sửa cấu trúc index hoặc câu query."*

---

## 5. Quy tắc vàng ESR: Equality ➔ Sort ➔ Range

Khi thiết kế một composite index cho các câu query phức tạp chứa cả dấu bằng (`=`), sắp xếp (`ORDER BY`), và điều kiện khoảng (`>`, `<`, `BETWEEN`), thứ tự khai báo các cột trong index quyết định sống còn việc query có bị dính `Using filesort` hay không:

$$\mathbf{E} \text{quality} \quad \longrightarrow \quad \mathbf{S} \text{ort} \quad \longrightarrow \quad \mathbf{R} \text{ange}$$

<MysqlIndexBeyondEqualityDiagram initialTab="esr_rule" />

### Tại sao lại là ESR mà không phải ERS?

Xét câu truy vấn:
```sql
SELECT id, status, priority, created_at FROM orders
WHERE status = 'PAID' 
  AND created_at > '2026-01-01'
ORDER BY priority DESC;
```

#### Kịch bản 1: Index (status, priority, created_at) — Chuẩn ESR ✅
1. **Equality (`status = 'PAID'`):** Thu hẹp cây B-tree vào đúng phân vùng của các đơn hàng đã thanh toán.
2. **Sort (`priority`):** Vì toàn bộ các dòng trong phân vùng này đều có `status` giống hệt nhau, các entry tiếp theo **vẫn được sắp xếp hoàn hảo theo `priority`**. Database chỉ cần duyệt lá theo chiều ngược lại (`DESC`) để lấy dữ liệu.
3. **Range (`created_at`):** Database vừa duyệt vừa kiểm tra `created_at > '2026-01-01'` thông qua cơ chế ICP ngay trên lá index.
4. **Kết quả:** **Zero Filesort!** Thời gian thực thi: **~1.2 ms**.

#### Kịch bản 2: Index (status, created_at, priority) — Bẫy ERS ❌
1. **Equality (`status = 'PAID'`):** Định vị vào phân vùng 'PAID'.
2. **Range (`created_at > '2026-01-01'`):** B-tree nhảy vào điểm thời gian đầu tiên và quét qua nhiều mốc ngày khác nhau (`2026-01-02`, `2026-01-03`, `2026-01-04`...).
3. **Mất thứ tự sắp xếp:** Tại mốc ngày `2026-01-02`, `priority` có thể là `(3, 1)`. Sang mốc ngày `2026-01-03`, `priority` lại là `(5, 2)`. Thứ tự toàn cục của `priority` đã bị **vỡ vụn** thành từng mảnh nhỏ!
4. **Kết quả:** MySQL không thể dùng index để trả về kết quả đã sắp xếp. Toàn bộ các dòng khớp phải được đẩy lên RAM để sắp xếp lại $\to$ Xuất hiện **`Using filesort`**, thời gian tăng vọt lên **~48.5 ms**.

:::important[Quy tắc 1 cột Range duy nhất]
Trong một câu query trên B-Tree, chỉ có duy nhất **MỘT** cột điều kiện khoảng được hưởng khả năng B-Tree Seek. Tất cả các cột đứng sau cột khoảng đầu tiên trong composite index đều mất khả năng seek, chỉ còn có thể đóng vai trò lọc (filter) hoặc covering.
:::

---

## 6. Index Condition Pushdown (ICP): Giảm 90%+ Random I/O

Trước MySQL 5.6, kiến trúc cơ sở dữ liệu phân chia ranh giới rất nghiêm ngặt giữa **Storage Engine (InnoDB)** và **Server Layer (Bộ xử lý SQL)**:

<MysqlIndexBeyondEqualityDiagram initialTab="icp" />

### Cơ chế hoạt động của ICP:

Xét câu truy vấn có index `(zipcode, address)`:
```sql
SELECT * FROM customers 
WHERE zipcode = '70000' 
  AND address LIKE '%Le Loi%';
```

* **Khi không có ICP (MySQL 5.5 trở về trước):**
  1. InnoDB dùng index để seek `zipcode = '70000'`. Giả sử tìm thấy **10,000 index entries**.
  2. Vì `address` chứa ký tự đại diện đứng đầu (`%Le Loi%`), InnoDB cho rằng nó không thể seek được.
  3. Với **mỗi một entry trong số 10,000 entry đó**, InnoDB thực hiện một thao tác Random I/O tra cứu về Clustered Table Heap để lấy toàn bộ dòng dữ liệu, rồi gửi lên MySQL Server.
  4. Server Layer duyệt qua 10,000 dòng, kiểm tra chuỗi `address LIKE '%Le Loi%'`, vứt bỏ 9,980 dòng và chỉ giữ lại 20 dòng khớp!
  5. **Lãng phí:** 9,980 lần đọc đĩa ngẫu nhiên vô ích.

* **Khi có ICP (`Using index condition` - MySQL 5.6+):**
  1. MySQL Server "đẩy" (push down) điều kiện `address LIKE '%Le Loi%'` xuống thẳng cho InnoDB.
  2. InnoDB sau khi seek `zipcode = '70000'`, lập tức kiểm tra chuỗi `address` **ngay trên lá của index** (nằm sẵn trong Buffer Pool trên RAM) *trước khi* quyết định tra cứu về bảng chính!
  3. 9,980 entry không khớp bị loại bỏ ngay tại tầng index.
  4. InnoDB **chỉ thực hiện đúng 20 lần tra cứu về bảng chính** cho 20 dòng thực sự thỏa mãn.
  5. **Hiệu năng:** Giảm 99.8% số lần Random I/O, thời gian thực thi giảm từ 82 ms xuống **1.4 ms**!

---

## 7. Kỹ thuật Deferred Join: Tăng tốc 148 lần

Quay trở lại câu query "vô vọng" từ mục 1. Nếu bạn có một bảng `contacts` lớn (512,000 dòng) với composite index `(last_name, first_name)`, nhưng người dùng chỉ tìm theo `first_name`:

```sql
-- Cách viết thông thường (Chạy mất ~143 ms)
SELECT * FROM contacts WHERE first_name = 'An5' LIMIT 100;
```

Vì `SELECT *` cần các cột nằm ngoài index (`phone, email, address, notes`), optimizer từ chối Skip Scan và rơi thẳng vào Table Scan (`type: ALL`). Nó phải duyệt qua **236,972 dòng** để gom đủ 100 bản ghi.

<MysqlIndexBeyondEqualityDiagram initialTab="deferred_join" />

### Bí quyết: Tách việc chọn dòng ra khỏi việc lấy dữ liệu

Thay vì bắt database vừa lọc, vừa vác theo toàn bộ dữ liệu nặng nề của từng dòng, ta chia thành 2 giai đoạn bằng kỹ thuật **Deferred Join (Late Materialization)**:

```sql
-- Kỹ thuật Deferred Join (Chạy mất ~0.87 ms - Nhanh hơn 148 lần!)
SELECT c.* 
FROM contacts c
JOIN (
    SELECT id 
    FROM contacts 
    WHERE first_name = 'An5' 
    LIMIT 100
) t ON t.id = c.id;
```

### Tại sao Deferred Join lại nhanh đến mức khó tin?

1. **Giai đoạn 1 (Subquery `t`):**
   * Câu lệnh `SELECT id FROM contacts WHERE first_name = 'An5' LIMIT 100` **chỉ yêu cầu đúng cột `id`**.
   * Trong InnoDB, mọi secondary index đều tự động lưu kèm khóa chính `id`. Do đó, index `(last_name, first_name)` chứa đủ cả `last_name, first_name, id` $\to$ Trở thành **Covering Index**!
   * Vì là covering, MySQL kích hoạt tính năng **Index Skip Scan**: nó "nhảy cóc" qua các họ khác nhau trong index trên RAM để tìm ra 100 giá trị `id` khớp, **không chạm vào ổ đĩa hay bảng chính một lần nào**.
2. **Giai đoạn 2 (Inner Join):**
   * Khi subquery `t` kết thúc siêu nhanh và trả về đúng 100 số `id`, MySQL thực hiện phép Join:
   ```
   -> Nested loop inner join (actual time=0.495..0.866 rows=100)
       -> Covering index skip scan on contacts using idx_name over first_name = 'An5' (actual rows=100)
       -> Single-row index lookup on c using PRIMARY (id=t.id) (actual rows=1 loops=100)
   ```
   * Thay vì quét 237,000 dòng bảng chính, MySQL chỉ thực hiện đúng **100 lần tra cứu khóa chính $O(1)$** theo `PRIMARY KEY`.
   * **Kết quả:** Cùng trả về đầy đủ tất cả các cột của 100 dòng dữ liệu, nhưng thời gian giảm từ 143 ms xuống **0.87 ms**.

---

## 8. Index Skip Scan (MySQL 8.0+) & Các bẫy tự sát làm chết Index

### 1. Index Skip Scan: Khi nào MySQL tự "nhảy cóc"?

Từ MySQL 8.0.13, cơ sở dữ liệu hỗ trợ cơ chế **Index Skip Scan**. Khi câu query bỏ qua cột tiền tố đầu tiên trong composite index, thay vì full scan, MySQL có thể thực hiện nhiều lần seek nhỏ:

```sql
-- Index: (gender, birth_date)
SELECT gender, birth_date FROM employees WHERE birth_date = '1990-05-15';
```

Vì cột `gender` chỉ có 2 giá trị phân biệt (`'M'`, `'F'`), MySQL chia câu query thành 2 bước tìm kiếm ngầm:
1. Seek `('M', '1990-05-15')`
2. Skip và Seek `('F', '1990-05-15')`

:::warning[Điều kiện ngặt nghèo của Skip Scan]
* Cột tiền tố bị bỏ qua phải có **độ phân biệt cực thấp (Low Cardinality)** (ví dụ: `gender`, `is_active`, `country_code`). Nếu cột đầu có hàng nghìn giá trị, Skip Scan sẽ chậm hơn cả Table Scan!
* Câu query bắt buộc phải là **Covering Index** (chỉ select các cột nằm trong index). Nếu có `SELECT *`, Skip Scan lập tức bị vô hiệu hóa (`query_references_nonkey_column`).
* Đừng dựa dẫm vào Skip Scan để thiết kế ẩu. Hãy luôn ưu tiên đặt đúng thứ tự cột theo Leftmost Prefix.
:::

### 2. Ba bẫy "tự sát" thường gặp làm vô hiệu hóa B-Tree

```
                ┌──────────────────────────────────────────────┐
                │        3 CÁCH DEV "TỰ GIẾT" INDEX            │
                └──────────────────────┬───────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
   BỌC CỘT TRONG HÀM          ÉP KIỂU NGẦM ĐỊNH (IMPLICIT)       DÙNG OR CẮT ĐÔI INDEX
WHERE DATE(created_at) = ?    WHERE phone = 0912345678         WHERE col_a = 1 OR col_b = 2
B-tree lưu created_at gốc,    phone là VARCHAR, MySQL ngầm     B-Tree chỉ đi theo một nhánh;
không lưu kết quả hàm         chuyển thành CAST(phone AS FLOAT) không thể seek 2 điều kiện
```

1. **Bọc cột trong hàm tính toán:**
   ```sql
   -- SAI: Vô hiệu hóa Seek, ép Table Scan
   WHERE DATE(created_at) = '2026-01-02';

   -- ĐÚNG: Giữ nguyên cột, biến đổi giá trị so sánh thành khoảng
   WHERE created_at >= '2026-01-02 00:00:00' 
     AND created_at <  '2026-01-03 00:00:00';
   ```
2. **Ép kiểu dữ liệu ngầm định (Implicit Type Conversion):**
   * Nếu cột `phone` là `VARCHAR(20)`, nhưng truy vấn truyền vào số nguyên:
   ```sql
   -- SAI: MySQL ngầm biến đổi thành WHERE CAST(phone AS DOUBLE) = 123456789
   WHERE phone = 0912345678;

   -- ĐÚNG: Luôn truyền đúng kiểu chuỗi
   WHERE phone = '0912345678';
   ```
3. **Mệnh đề `OR` cắt đôi index:**
   * Một index `(a, b)` không thể phục vụ cho `WHERE a = 1 OR b = 2`. Muốn tối ưu `OR`, hoặc phải có 2 index riêng biệt cho `a` và `b` để MySQL kích hoạt `index_merge`, hoặc chuyển đổi câu query thành `UNION ALL`:
   ```sql
   SELECT * FROM orders WHERE customer_id = 10
   UNION ALL
   SELECT * FROM orders WHERE status = 'PENDING' AND customer_id != 10;
   ```

---

## 9. Checklist Code Review Index cho Senior Backend Engineer

Mỗi khi xem xét một Pull Request liên quan đến Database Migration và câu lệnh SQL, hãy đối chiếu qua 6 tiêu chuẩn vàng sau:

```markdown
### 📋 Production Indexing Review Checklist

- [ ] 1. Ranh giới Seek vs Filter:
      Cột nào trong composite index thực sự được Seek? Cột nào chỉ đóng vai trò Filter qua ICP?
- [ ] 2. Thứ tự ESR (Equality -> Sort -> Range):
      Các cột dấu bằng (=) đã đứng trước? Cột ORDER BY có đứng trước cột điều kiện khoảng không?
- [ ] 3. Độc quyền một cột Range:
      Có nhiều hơn một cột so sánh khoảng (>, <, BETWEEN, LIKE) trong WHERE không? Cột khoảng quan trọng nhất đã được ưu tiên chưa?
- [ ] 4. Tách SELECT * (Deferred Join):
      Với các truy vấn lọc phân trang sâu hoặc tìm kiếm đa tiêu chí, đã áp dụng Deferred Join để index chạy covering trên `id` chưa?
- [ ] 5. Không bọc hàm & Đúng kiểu dữ liệu:
      Có biểu thức hàm nào bọc quanh tên cột (DATE, LOWER, SUBSTR) không? Kiểu dữ liệu tham số truyền vào có khớp chính xác với kiểu khai báo của cột không?
- [ ] 6. Cắt tỉa Index thừa:
      Bảng hiện có bao nhiêu index? Có index nào là tiền tố trùng lặp của index khác không? (ví dụ: đã có `(shop_id, created_at)` thì không cần giữ thêm index `(shop_id)`).
```

---

## 10. Tóm tắt & Hướng phát triển

* **Đánh index không chỉ là nhìn vào mệnh đề `WHERE`**: Hiệu năng thực sự của database đến từ việc phối hợp giữa B-Tree Seek, Index Condition Pushdown (ICP) và triệt tiêu `Using filesort`.
* **Covering không phải một loại index**, mà là mối quan hệ hoàn hảo giữa một câu query và một cấu trúc index khi mọi dữ liệu cần thiết đều nằm sẵn trong lá.
* **Deferred Join** là giải pháp tối thượng cho các câu query phức tạp: phân tách việc "tìm dòng thỏa mãn" (chạy siêu nhẹ trong index) ra khỏi việc "lấy toàn bộ dữ liệu" (tra cứu khóa chính $O(1)$).
