import React, { useState } from 'react';

type TabType = 'matrix_2x2' | 'concurrency_vs_parallelism' | 'async_vs_multithreading' | 'decision_engine';
type MatrixQuadrant = 'sync_blocking' | 'sync_nonblocking' | 'async_blocking' | 'async_nonblocking';

export default function AsyncConcurrencyModelsDiagram({ initialTab = 'matrix_2x2' }: { initialTab?: TabType }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedQuadrant, setSelectedQuadrant] = useState<MatrixQuadrant>('async_nonblocking');
  const [workloadType, setWorkloadType] = useState<'io_heavy' | 'cpu_heavy' | 'mixed_legacy'>('io_heavy');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .acm-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--ifm-color-emphasis-300);
          padding-bottom: 8px;
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .acm-tab-btn {
          background: transparent;
          border: 1px solid var(--ifm-color-emphasis-300);
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--ifm-color-content-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .acm-tab-btn:hover {
          background: var(--ifm-color-emphasis-100);
          color: var(--ifm-color-content);
        }
        .acm-tab-btn.active {
          background: rgba(56, 189, 248, 0.12);
          border-color: #38bdf8;
          color: #38bdf8;
        }
        .acm-grid-2col {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .acm-grid-2col {
            grid-template-columns: 1fr;
          }
        }
        .acm-card {
          background: var(--ifm-card-background-color, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--ifm-color-emphasis-200);
          border-radius: 8px;
          padding: 16px;
        }
        .acm-quadrant-btn {
          text-align: left;
          width: 100%;
          border-radius: 8px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .acm-flowing-dash {
          stroke-dasharray: 6 6;
          animation: acmFlow 1.4s linear infinite;
        }
        @keyframes acmFlow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(56, 189, 248, 0.08)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '8px 8px 0 0',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#38bdf8' }}>
            Concurrency, Asynchrony & Threading Models Visualizer
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', background: 'var(--ifm-color-emphasis-200)', padding: '2px 8px', borderRadius: '4px' }}>
          Interactive Architectural Guide
        </span>
      </div>

      {/* Tabs */}
      <div className="acm-tabs">
        <button
          className={`acm-tab-btn ${activeTab === 'matrix_2x2' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix_2x2')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
          1. The 2×2 Matrix (Sync/Async & Blocking/Non-blocking)
        </button>
        <button
          className={`acm-tab-btn ${activeTab === 'concurrency_vs_parallelism' ? 'active' : ''}`}
          onClick={() => setActiveTab('concurrency_vs_parallelism')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          2. Concurrency vs Parallelism
        </button>
        <button
          className={`acm-tab-btn ${activeTab === 'async_vs_multithreading' ? 'active' : ''}`}
          onClick={() => setActiveTab('async_vs_multithreading')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
          3. Async vs Multi-threading Models
        </button>
        <button
          className={`acm-tab-btn ${activeTab === 'decision_engine' ? 'active' : ''}`}
          onClick={() => setActiveTab('decision_engine')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
          4. Architectural Decision Engine
        </button>
      </div>

      {/* TAB 1: 2x2 Matrix */}
      {activeTab === 'matrix_2x2' && (
        <div>
          <p style={{ fontSize: '14px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
            <strong>Sync vs Async</strong> xác định <em>thời điểm và cơ chế người gọi nhận kết quả</em> (trực tiếp vs qua thông báo). <strong>Blocking vs Non-blocking</strong> xác định <em>trạng thái của Thread</em> (nhường CPU nằm chờ vs tiếp tục giữ CPU làm việc khác). Bấm vào từng ô để xem chi tiết luồng xử lý:
          </p>

          <div className="acm-grid-2col">
            {/* 2x2 Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Sync Blocking */}
              <button
                className="acm-quadrant-btn"
                style={{
                  background: selectedQuadrant === 'sync_blocking' ? 'rgba(248, 113, 113, 0.15)' : 'var(--ifm-color-emphasis-100)',
                  borderColor: selectedQuadrant === 'sync_blocking' ? '#f87171' : 'var(--ifm-color-emphasis-200)',
                }}
                onClick={() => setSelectedQuadrant('sync_blocking')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>Sync + Blocking</span>
                  <span style={{ fontSize: '11px', background: '#f87171', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>BIO</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                  Đứng đợi kết quả + Thread bị treo (WAITING).
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  Java InputStream, Standard JDBC.
                </div>
              </button>

              {/* Sync Non-blocking */}
              <button
                className="acm-quadrant-btn"
                style={{
                  background: selectedQuadrant === 'sync_nonblocking' ? 'rgba(251, 191, 36, 0.15)' : 'var(--ifm-color-emphasis-100)',
                  borderColor: selectedQuadrant === 'sync_nonblocking' ? '#fbbf24' : 'var(--ifm-color-emphasis-200)',
                }}
                onClick={() => setSelectedQuadrant('sync_nonblocking')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>Sync + Non-blocking</span>
                  <span style={{ fontSize: '11px', background: '#fbbf24', color: '#000', padding: '1px 6px', borderRadius: '4px' }}>Polling</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                  Hỏi liên tục + Thread không ngủ (RUNNABLE).
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  O_NONBLOCK read(), Spinlock, busy-wait.
                </div>
              </button>

              {/* Async Blocking */}
              <button
                className="acm-quadrant-btn"
                style={{
                  background: selectedQuadrant === 'async_blocking' ? 'rgba(167, 139, 250, 0.15)' : 'var(--ifm-color-emphasis-100)',
                  borderColor: selectedQuadrant === 'async_blocking' ? '#a78bfa' : 'var(--ifm-color-emphasis-200)',
                }}
                onClick={() => setSelectedQuadrant('async_blocking')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa' }}>Async + Blocking</span>
                  <span style={{ fontSize: '11px', background: '#a78bfa', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>Multiplex</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                  Nhận Future/Event + Nhưng Thread chủ động block đợi.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  future.get(), select(), epoll_wait().
                </div>
              </button>

              {/* Async Non-blocking */}
              <button
                className="acm-quadrant-btn"
                style={{
                  background: selectedQuadrant === 'async_nonblocking' ? 'rgba(52, 211, 153, 0.15)' : 'var(--ifm-color-emphasis-100)',
                  borderColor: selectedQuadrant === 'async_nonblocking' ? '#34d399' : 'var(--ifm-color-emphasis-200)',
                }}
                onClick={() => setSelectedQuadrant('async_nonblocking')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>Async + Non-blocking</span>
                  <span style={{ fontSize: '11px', background: '#34d399', color: '#000', padding: '1px 6px', borderRadius: '4px' }}>Reactor/Proactor</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                  Bắn lệnh & đi làm việc khác + Callback khi xong.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                  Node.js libuv, Netty, Linux io_uring.
                </div>
              </button>
            </div>

            {/* Detail Card for Selected Quadrant */}
            <div className="acm-card">
              {selectedQuadrant === 'sync_blocking' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }}></span>
                    <strong style={{ color: '#f87171', fontSize: '15px' }}>Mô Hình: Synchronous + Blocking</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    <strong>Ví dụ thực tế:</strong> Bạn đến quầy gọi 1 ly latte. Bạn đứng chết trân ở quầy, không bấm điện thoại, không đi vệ sinh, mắt nhìn vào máy pha cà phê cho đến khi nhân viên đưa ly latte tận tay.
                  </p>
                  <div style={{ background: 'var(--ifm-code-background, #1e293b)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#f8fafc', marginBottom: '10px' }}>
                    {`// Java BIO (Blocking I/O)
Socket socket = serverSocket.accept(); // Thread BỊ TREO ở đây
InputStream in = socket.getInputStream();
int data = in.read(); // Thread BỊ TREO đến khi có byte gửi tới`}
                  </div>
                  <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', paddingLeft: '18px', margin: 0 }}>
                    <li><strong>CPU Utilization:</strong> Rất thấp (Thread ngủ, CPU rảnh nhưng không làm được gì nếu hết thread pool).</li>
                    <li><strong>Resource Cost:</strong> Mỗi client ngốn 1 OS Thread (~1MB RAM Stack). 10,000 clients = 10GB RAM chỉ để ngủ.</li>
                    <li><strong>Ưu điểm:</strong> Code tuần tự dễ viết, dễ debug stack trace.</li>
                  </ul>
                </div>
              )}

              {selectedQuadrant === 'sync_nonblocking' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}></span>
                    <strong style={{ color: '#fbbf24', fontSize: '15px' }}>Mô Hình: Synchronous + Non-blocking</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    <strong>Ví dụ thực tế:</strong> Bạn gọi cà phê. Nhân viên bảo: "chưa xong". Bạn không đứng yên mà đi dạo quanh, nhưng cứ 5 giây bạn lại chạy vào quầy hỏi: "Xong chưa anh?". Cứ thế liên tục cho đến khi nhận cà phê.
                  </p>
                  <div style={{ background: 'var(--ifm-code-background, #1e293b)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#f8fafc', marginBottom: '10px' }}>
                    {`// Non-blocking Socket Polling
socketChannel.configureBlocking(false);
while ((bytesRead = socketChannel.read(buf)) == 0) {
    // Thread KHÔNG NGỦ, nhưng phải liên tục quay lại hỏi
    // Gây lãng phí 100% 1 lõi CPU (Busy Waiting)!
}`}
                  </div>
                  <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', paddingLeft: '18px', margin: 0 }}>
                    <li><strong>CPU Utilization:</strong> 100% Spike (Burn CPU cycles vô ích vào các lần hỏi rỗng).</li>
                    <li><strong>Nguy cơ:</strong> Busy-spin, nóng máy, quạt tản nhiệt quay tối đa nếu không có sleep backoff.</li>
                    <li><strong>Ứng dụng:</strong> Spinlock trong Linux Kernel cho các đoạn critical section siêu ngắn (&lt; 1 microsecond).</li>
                  </ul>
                </div>
              )}

              {selectedQuadrant === 'async_blocking' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a78bfa' }}></span>
                    <strong style={{ color: '#a78bfa', fontSize: '15px' }}>Mô Hình: Asynchronous + Blocking</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    <strong>Ví dụ thực tế:</strong> Bạn gọi cà phê và nhân viên đưa cho bạn một thẻ rung (Future/Promise). Thay vì cầm thẻ đi chỗ khác làm việc, bạn lại ngồi xuống bàn và dán mắt vào thẻ rung, không làm bất kỳ việc gì khác cho đến khi nó rung lên.
                  </p>
                  <div style={{ background: 'var(--ifm-code-background, #1e293b)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#f8fafc', marginBottom: '10px' }}>
                    {`// Anti-pattern: Async Call nhưng Block kết quả
CompletableFuture<User> future = userService.getUserAsync(id);
// Phá hỏng hoàn toàn lợi ích bất đồng bộ:
User user = future.get(); // Calling thread BỊ TREO CHẶN hoàn toàn!`}
                  </div>
                  <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', paddingLeft: '18px', margin: 0 }}>
                    <li><strong>I/O Multiplexing (select/poll):</strong> Bản thân lời gọi `select()` là blocking trên một tập các file descriptors, nhưng giúp 1 thread giám sát được hàng nghìn socket.</li>
                    <li><strong>Cạm bẫy:</strong> Gọi `.get()` hoặc `.join()` trên Future/CompletableFuture làm cạn kiệt thread pool của service gọi.</li>
                  </ul>
                </div>
              )}

              {selectedQuadrant === 'async_nonblocking' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }}></span>
                    <strong style={{ color: '#34d399', fontSize: '15px' }}>Mô Hình: Asynchronous + Non-blocking</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    <strong>Ví dụ thực tế:</strong> Bạn gọi cà phê, nhận thẻ rung. Bạn ra bàn mở laptop làm việc, gọi điện thoại. Khi cà phê xong, chuông reo hoặc nhân viên mang cà phê tới tận bàn (Callback). Bạn không lãng phí 1 giây nào chờ đợi.
                  </p>
                  <div style={{ background: 'var(--ifm-code-background, #1e293b)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#f8fafc', marginBottom: '10px' }}>
                    {`// Reactive / Event-driven Non-blocking
webClient.get().uri("/orders")
  .retrieve()
  .bodyToMono(Order.class)
  .subscribe(order -> process(order)); // Nhả thread ngay lập tức!`}
                  </div>
                  <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', paddingLeft: '18px', margin: 0 }}>
                    <li><strong>Throughput:</strong> Tối đa hóa hiệu năng. 1 Thread (hoặc số thread = số CPU cores) có thể xử lý 100,000+ kết nối đồng thời.</li>
                    <li><strong>Công nghệ:</strong> Node.js (V8 Event Loop), Netty, Spring WebFlux, Linux `io_uring`, Go goroutines.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Concurrency vs Parallelism */}
      {activeTab === 'concurrency_vs_parallelism' && (
        <div>
          <div className="acm-grid-2col" style={{ marginBottom: '16px' }}>
            {/* SVG Visual Timeline */}
            <div className="acm-card">
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#38bdf8' }}>
                Khác Biệt Vật Lý: Time-Slicing vs True Multi-Core Execution
              </div>

              <svg width="100%" height="240" viewBox="0 0 460 240" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                {/* Concurrency (Single Core) */}
                <text x="15" y="25" fill="#fbbf24" fontSize="13" fontWeight="bold">Concurrency (1 CPU Core - Interleaved)</text>
                
                {/* Core 0 Box */}
                <rect x="15" y="40" width="70" height="30" rx="4" fill="#334155" />
                <text x="32" y="60" fill="#94a3b8" fontSize="11" fontWeight="bold">Core 0</text>
                
                {/* Timeline bar 1 */}
                <rect x="100" y="42" width="65" height="26" rx="4" fill="#38bdf8" />
                <text x="115" y="59" fill="#0f172a" fontSize="11" fontWeight="bold">Task A</text>
                
                {/* Context switch gap */}
                <line x1="168" y1="45" x2="168" y2="65" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
                
                <rect x="172" y="42" width="65" height="26" rx="4" fill="#34d399" />
                <text x="187" y="59" fill="#0f172a" fontSize="11" fontWeight="bold">Task B</text>
                
                <rect x="242" y="42" width="65" height="26" rx="4" fill="#38bdf8" />
                <text x="257" y="59" fill="#0f172a" fontSize="11" fontWeight="bold">Task A</text>

                <rect x="312" y="42" width="65" height="26" rx="4" fill="#34d399" />
                <text x="327" y="59" fill="#0f172a" fontSize="11" fontWeight="bold">Task B</text>

                <text x="390" y="59" fill="#64748b" fontSize="11">Time ➔</text>
                <text x="100" y="85" fill="#94a3b8" fontSize="10">Xử lý nhiều việc bằng cách hoán đổi (Time-slicing). Không chạy cùng tích tắc.</text>

                {/* Divider */}
                <line x1="15" y1="105" x2="440" y2="105" stroke="var(--ifm-color-emphasis-300)" strokeWidth="1" />

                {/* Parallelism (Multi-Core) */}
                <text x="15" y="130" fill="#34d399" fontSize="13" fontWeight="bold">Parallelism (2+ CPU Cores - Simultaneous)</text>

                {/* Core 0 Box */}
                <rect x="15" y="145" width="70" height="30" rx="4" fill="#334155" />
                <text x="32" y="165" fill="#94a3b8" fontSize="11" fontWeight="bold">Core 0</text>
                <rect x="100" y="147" width="280" height="26" rx="4" fill="#38bdf8" />
                <text x="190" y="164" fill="#0f172a" fontSize="11" fontWeight="bold">Task A (Chạy liên tục)</text>

                {/* Core 1 Box */}
                <rect x="15" y="185" width="70" height="30" rx="4" fill="#334155" />
                <text x="32" y="205" fill="#94a3b8" fontSize="11" fontWeight="bold">Core 1</text>
                <rect x="100" y="187" width="280" height="26" rx="4" fill="#34d399" />
                <text x="190" y="204" fill="#0f172a" fontSize="11" fontWeight="bold">Task B (Chạy liên tục đồng thời)</text>

                <text x="100" y="230" fill="#94a3b8" fontSize="10">Hai tác vụ thực thi tại CÙNG MỘT THỜI ĐIỂM VẬT LÝ trên 2 lõi CPU riêng biệt.</text>
              </svg>
            </div>

            {/* Comparison Details */}
            <div className="acm-card">
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#fbbf24' }}>
                So Sánh Cốt Lõi: Rob Pike's Axiom
              </div>
              <blockquote style={{ fontSize: '13px', margin: '0 0 12px 0', borderLeft: '3px solid #38bdf8', paddingLeft: '10px' }}>
                "Concurrency is about <strong>dealing</strong> with lots of things at once. Parallelism is about <strong>doing</strong> lots of things at once."
              </blockquote>
              
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#fbbf24' }}>Concurrency (Cấu trúc chương trình):</strong>
                  <div>Chia nhỏ vấn đề thành các đơn vị thực thi độc lập có thể chạy xen kẽ nhau. Mục tiêu là <strong>Responsiveness (tính phản hồi)</strong> và không bị nghẽn khi chờ đợi I/O.</div>
                </div>
                <div>
                  <strong style={{ color: '#34d399' }}>Parallelism (Năng lực phần cứng):</strong>
                  <div>Sử dụng nhiều đơn vị tính toán vật lý (ALU/Cores) để tăng tốc độ xử lý tổng thể. Mục tiêu là <strong>Throughput & Execution Speed</strong> cho các bài toán CPU-bound.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Async vs Multi-threading */}
      {activeTab === 'async_vs_multithreading' && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
            Sự ngộ nhận lớn nhất: <em>"Muốn xử lý nhiều request async thì phải tạo nhiều thread."</em> Thực tế, <strong>Asynchronous</strong> là mô hình kiến trúc luồng dữ liệu (bỏ chờ đợi), còn <strong>Multi-threading</strong> là mô hình tài nguyên OS (công nhân).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {/* Model 1: Multi-threaded Sync */}
            <div className="acm-card" style={{ borderTop: '3px solid #f87171' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#f87171', fontSize: '14px' }}>1. Multi-Threaded Sync</strong>
                <span style={{ fontSize: '10px', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', padding: '2px 6px', borderRadius: '4px' }}>Thread-per-Request</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                Điển hình: <strong>Spring Boot 2 / Tomcat</strong> truyền thống.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                • Mỗi request chiếm trọn 1 OS Thread.<br/>
                • Khi gọi Database hoặc gọi API khác, thread đó bị <strong>block ngủ</strong>.<br/>
                • Giới hạn: ~200 threads trong pool. Nếu 200 request đều chờ DB 2s &rarr; <strong>Hệ thống nghẽn sạch toàn bộ!</strong>
              </div>
            </div>

            {/* Model 2: Single-threaded Async */}
            <div className="acm-card" style={{ borderTop: '3px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#38bdf8', fontSize: '14px' }}>2. Single-Threaded Async</strong>
                <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>Event Loop</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                Điển hình: <strong>Node.js, Redis, Nginx</strong>.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                • <strong>CHỈ DÙNG 1 THREAD DUY NHẤT</strong>.<br/>
                • Sử dụng Linux `epoll` để theo dõi hàng chục nghìn socket.<br/>
                • Khi có I/O wait, Event Loop nhảy sang làm request khác.<br/>
                • Không tốn chi phí Context-Switching, RAM cực nhẹ. Nhưng nếu có 1 đoạn mã CPU-heavy (ví dụ tính toán vòng lặp vô tận) &rarr; <strong>Toàn bộ server bị đơ!</strong>
              </div>
            </div>

            {/* Model 3: Multi-threaded Async */}
            <div className="acm-card" style={{ borderTop: '3px solid #34d399' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#34d399', fontSize: '14px' }}>3. Multi-Threaded Async</strong>
                <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>Reactor Pattern</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                Điển hình: <strong>Netty, Spring WebFlux, Vert.x</strong>.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                • Chạy N Event Loops (với N = số CPU Cores).<br/>
                • Tận dụng trọn vẹn sức mạnh đa lõi của phần cứng mà không cần tạo hàng nghìn threads.<br/>
                • Tác vụ I/O chạy non-blocking; tác vụ CPU nặng được đẩy sang Worker Thread Pool riêng biệt.
              </div>
            </div>

            {/* Model 4: Virtual Threads (M:N) */}
            <div className="acm-card" style={{ borderTop: '3px solid #a78bfa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#a78bfa', fontSize: '14px' }}>4. Virtual Threads (M:N)</strong>
                <span style={{ fontSize: '10px', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>Java 21 Loom</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                Điển hình: <strong>Java 21+ Project Loom, Go goroutines</strong>.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                • Viết code tuần tự synchronous, blocking dễ đọc.<br/>
                • Dưới nền, JVM tự động unmount Virtual Thread khỏi Carrier Thread khi gặp I/O blocking call.<br/>
                • Có thể tạo <strong>1,000,000 Virtual Threads</strong> chỉ tốn vài trăm MB RAM.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Decision Engine */}
      {activeTab === 'decision_engine' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Chọn bản chất khối lượng công việc (Workload Profile): </span>
            <div style={{ display: 'inline-flex', gap: '8px', marginLeft: '10px' }}>
              <button
                className={`acm-tab-btn ${workloadType === 'io_heavy' ? 'active' : ''}`}
                onClick={() => setWorkloadType('io_heavy')}
              >
                🌐 I/O Heavy (Microservices, DB, REST)
              </button>
              <button
                className={`acm-tab-btn ${workloadType === 'cpu_heavy' ? 'active' : ''}`}
                onClick={() => setWorkloadType('cpu_heavy')}
              >
                ⚡ CPU Heavy (Tính toán, Mã hóa, Video)
              </button>
              <button
                className={`acm-tab-btn ${workloadType === 'mixed_legacy' ? 'active' : ''}`}
                onClick={() => setWorkloadType('mixed_legacy')}
              >
                🏛️ Legacy Relational DB (JDBC / Blocking drivers)
              </button>
            </div>
          </div>

          <div className="acm-card">
            {workloadType === 'io_heavy' && (
              <div>
                <h4 style={{ color: '#34d399', margin: '0 0 8px 0' }}>✅ Lựa Chọn Kiến Trúc Tối Ưu: Asynchronous Non-blocking hoặc Virtual Threads</h4>
                <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
                  Đặc điểm: 95% thời gian xử lý request là nằm chờ database phản hồi hoặc network packet từ downstream microservices.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '10px', borderRadius: '6px' }}>
                    <strong style={{ color: '#38bdf8', fontSize: '13px' }}>Option A: Java 21+ Virtual Threads</strong>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--ifm-color-content)' }}>
                      Giữ nguyên phong cách code blocking quen thuộc (`RestTemplate`, Spring Boot 3 `spring.threads.virtual.enabled=true`). Đạt hàng trăm nghìn concurrent requests mà không cần học Reactive streams.
                    </p>
                  </div>
                  <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '10px', borderRadius: '6px' }}>
                    <strong style={{ color: '#34d399', fontSize: '13px' }}>Option B: Reactive WebFlux / Netty / Node.js</strong>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--ifm-color-content)' }}>
                      Hiệu năng cao nhất, footprint RAM thấp nhất. Thích hợp cho API Gateway, WebSocket server, Chat streaming, Proxy forwarder.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {workloadType === 'cpu_heavy' && (
              <div>
                <h4 style={{ color: '#fbbf24', margin: '0 0 8px 0' }}>✅ Lựa Chọn Kiến Trúc Tối Ưu: Multi-Threaded Parallelism (Worker Thread Pool)</h4>
                <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
                  Đặc điểm: Các phép toán ăn trọn 100% CPU cycles (ví dụ nén file zip, mã hóa token RSA, training model, xử lý đồ họa).
                </p>
                <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  • <strong>KHÔNG DÙNG:</strong> Single-threaded Event Loop (Node.js/Python asyncio) vì sẽ đóng băng toàn bộ hệ thống.<br/>
                  • <strong>KHÔNG DÙNG:</strong> Virtual Threads (vì Virtual Thread không làm CPU chạy nhanh hơn, chỉ giải quyết I/O wait).<br/>
                  • <strong>GIẢI PHÁP:</strong> Sử dụng Thread Pool kích thước bằng đúng số lõi CPU vật lý: <code>Runtime.getRuntime().availableProcessors()</code>. Dùng <strong>ForkJoinPool</strong>, Parallel Streams, hoặc Go workers.
                </div>
              </div>
            )}

            {workloadType === 'mixed_legacy' && (
              <div>
                <h4 style={{ color: '#f87171', margin: '0 0 8px 0' }}>⚠️ Cạm Bẫy Kiến Trúc: Blocking Driver Poisoning</h4>
                <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
                  Đặc điểm: Bạn dùng thư viện Reactive / Non-blocking WebFlux nhưng database driver lại là JDBC chuẩn (HikariCP / Hibernate) vốn dĩ là synchronous blocking socket!
                </p>
                <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  • <strong>Nguy cơ chết đứng (Deadlock):</strong> Nếu một tác vụ blocking JDBC chạy trên Event Loop thread của Netty, toàn bộ các request khác cùng Event Loop đó sẽ bị treo cứng.<br/>
                  • <strong>Giải pháp chuẩn:</strong> Hoặc chuyển hẳn sang R2DBC (Reactive Relational Database Connectivity), hoặc bọc khối code JDBC vào một Scheduler riêng biệt (<code>Schedulers.boundedElastic()</code>), hoặc chuyển sang Java 21 Virtual Threads.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
