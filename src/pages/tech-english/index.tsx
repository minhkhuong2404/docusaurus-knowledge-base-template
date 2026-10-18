import React, { useState, useCallback } from 'react';
import Layout from '@theme/Layout';
import TechGlossaryFlashcards, { TECH_TERMS } from '../../components/TechGlossaryFlashcards';

type EnglishTab = 'flashcards' | 'quiz' | 'dictionary' | 'traps' | 'playbook';

interface PronunciationTrap {
  term: string;
  ipa: string;
  vietnameseGuide: string;
  wrongGuide: string;
  explanation: string;
}

const PRONUNCIATION_TRAPS: PronunciationTrap[] = [
  {
    term: 'Queue',
    ipa: '/kjuː/',
    vietnameseGuide: 'Kiu (giống chữ Q)',
    wrongGuide: 'Qui-u, Que-u-e',
    explanation: 'Có 5 chữ cái nhưng 4 chữ cái cuối đều câm! Đọc chính xác là /kjuː/ như chữ Q.',
  },
  {
    term: 'Cache',
    ipa: '/kæʃ/',
    vietnameseGuide: 'Kash (như từ Cash - tiền mặt)',
    wrongGuide: 'Cát-sê, Cây-chơ',
    explanation: 'Mượn từ tiếng Pháp nhưng trong tiếng Anh Mỹ phát âm hoàn toàn đồng âm với từ "cash".',
  },
  {
    term: 'Schema',
    ipa: '/ˈskiː.mə/',
    vietnameseGuide: 'S-ki-mơ (âm /k/)',
    wrongGuide: 'S-che-ma, S-kê-ma',
    explanation: 'Chữ "ch" bắt nguồn từ tiếng Hy Lạp nên phát âm là âm /k/, không phải /tʃ/ hay /ʃ/.',
  },
  {
    term: 'Archive',
    ipa: '/ˈɑːr.kaɪv/',
    vietnameseGuide: 'A-khaiv (âm /k/)',
    wrongGuide: 'A-chíp, A-chít',
    explanation: 'Chữ "ch" là âm /k/, đuôi "ive" phát âm là /aɪv/ (như dive, live).',
  },
  {
    term: 'Epoch',
    ipa: '/ˈep.ək/ hoặc /ˈiː.pɑːk/',
    vietnameseGuide: 'Ep-ơk hoặc Y-pók',
    wrongGuide: 'Ê-pót, Ê-pót-chơ',
    explanation: 'Thời điểm Unix Epoch (1970). Đuôi "ch" là âm /k/.',
  },
  {
    term: 'Boolean',
    ipa: '/ˈbuː.li.ən/',
    vietnameseGuide: 'Bu-li-ơn',
    wrongGuide: 'Bu-len, Bô-lê-an',
    explanation: 'Đặt theo tên nhà toán học George Boole: Âm đầu là /buː/ và đuôi là /li.ən/.',
  },
  {
    term: 'Tuple',
    ipa: '/ˈtʌp.əl/ hoặc /ˈtuː.pəl/',
    vietnameseGuide: 'Táp-pồ hoặc Tu-pồ',
    wrongGuide: 'Túp-lơ, Túp-lê',
    explanation: 'Cấu trúc dữ liệu bộ giá trị. Phát âm phổ biến nhất tại Mỹ là /ˈtʌp.əl/.',
  },
  {
    term: 'Asynchronous',
    ipa: '/eɪˈsɪŋ.krə.nəs/',
    vietnameseGuide: 'Ây-sinh-krơ-nợs',
    wrongGuide: 'A-sinh-chô-nớt',
    explanation: 'Chữ "a" đầu đọc là /eɪ/, cụm "chron" đọc là /krə/.',
  },
  {
    term: 'Idempotency',
    ipa: '/ˌaɪ.dəmˈpoʊ.tən.si/',
    vietnameseGuide: 'Ai-đơm-pâu-tân-si',
    wrongGuide: 'Ít-đèm-pô-ten-xi',
    explanation: 'Trọng âm phụ ở âm tiết đầu /aɪ/, trọng âm chính ở âm tiết thứ ba /ˈpoʊ/.',
  },
  {
    term: 'Hierarchy',
    ipa: '/ˈhaɪ.rɑːr.ki/',
    vietnameseGuide: 'Hai-ra-khi (âm /k/)',
    wrongGuide: 'Hia-rác-chi, Hê-ra-chi',
    explanation: 'Âm đầu là /haɪ/, cụm "arch" đọc là /rɑːr.k/, đuôi "y" đọc là /i/.',
  },
];

interface ConfusionPair {
  termA: string;
  termB: string;
  diffSummary: string;
  detailA: string;
  detailB: string;
  codeOrExample: string;
}

const CONFUSION_PAIRS: ConfusionPair[] = [
  {
    termA: 'Authentication (AuthN)',
    termB: 'Authorization (AuthZ)',
    diffSummary: 'AuthN là "Bạn là ai?" vs AuthZ là "Bạn được phép làm những gì?"',
    detailA: 'Xác minh danh tính người dùng thông qua thông tin đăng nhập (Username/Password, OTP, Sinh trắc học, Chữ ký số). Trả về Principal.',
    detailB: 'Kiểm tra quyền hạn và vai trò (Role, Scope, Permission) sau khi danh tính đã được xác thực thành công. Ví dụ: Khách hàng vs Quản trị viên.',
    codeOrExample: '// AuthN: Validate JWT signature\n// AuthZ: Check @PreAuthorize("hasRole(\'ADMIN\')")',
  },
  {
    termA: 'Concurrency',
    termB: 'Parallelism',
    diffSummary: 'Concurrency là cấu trúc chương trình (quản lý xen kẽ) vs Parallelism là thực thi vật lý đa nhân',
    detailA: 'Quản lý nhiều tác vụ bằng phân chia thời gian (Time-Slicing) trên 1 CPU core hoặc nhiều luồng logic. Tập trung vào cấu trúc (dealing with many things).',
    detailB: 'Thực thi nhiều phép tính tại cùng một chu kỳ xung nhịp clock trên nhiều CPU cores vật lý (doing many things at once). Bắt buộc cần phần cứng multi-core.',
    codeExample: '// Concurrency: 1 chef stirring 5 pots on 1 stove (Interleaving)\n// Parallelism: 5 chefs on 5 stoves (Hardware execution)',
  },
  {
    termA: 'Latency',
    termB: 'Throughput',
    diffSummary: 'Latency là độ trễ của 1 request (ms) vs Throughput là số request xong trong 1 giây (RPS)',
    detailA: 'Thời gian cần thiết để một tín hiệu hoặc gói tin truyền từ Client tới Server và phản hồi (Round-Trip Time). Đo bằng p95, p99 ms.',
    detailB: 'Tổng khối lượng công việc hệ thống hoàn thành trong 1 đơn vị thời gian (Requests Per Second - RPS). Little\'s Law liên kết cả hai: L = λ × W.',
    codeExample: '// Low Latency: API returns in 10ms\n// High Throughput: API handles 50,000 requests/second',
  },
  {
    termA: 'Synchronous',
    termB: 'Blocking',
    diffSummary: 'Sync là cơ chế nhận kết quả đồng nhịp vs Blocking là trạng thái Thread ngủ trên OS',
    detailA: 'Người gọi phát lệnh và không thể tiếp tục cho tới khi nhận được kết quả trực tiếp từ người nhận (Lockstep execution).',
    detailB: 'Hệ điều hành đưa Thread gọi lệnh vào trạng thái ngủ (BLOCKED/WAITING), gỡ khỏi CPU và lưu registers, chờ I/O hoàn tất.',
    codeExample: '// You can be Asynchronous but Blocking if you call future.get()!\n// You can be Synchronous but Non-blocking via polling.',
  },
  {
    termA: 'Scalability',
    termB: 'Elasticity',
    diffSummary: 'Scalability là năng lực chịu tải khi nâng cấp phần cứng vs Elasticity là tự co giãn theo nhu cầu tức thời',
    detailA: 'Khả năng của hệ thống tăng trưởng năng suất tỷ lệ thuận khi bổ sung thêm tài nguyên phần cứng (Scale Up RAM/CPU hoặc Scale Out thêm node).',
    detailB: 'Khả năng của hệ thống tự động cấp phát hoặc thu hồi tài nguyên (Auto-scaling pods/VMs) tương ứng với lưu lượng tải tăng giảm theo thời gian thực.',
    codeExample: '// Scalability: Adding 10 Kafka brokers doubles message capacity\n// Elasticity: Kubernetes HPA scales pods from 2 to 20 during flash-sale',
  },
];

export default function TechEnglishHubPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<EnglishTab>('flashcards');

  // Audio helper
  const speakWord = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn hiện chưa hỗ trợ Web Speech API.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  return (
    <Layout
      title="Tech English Hub — Master English Technical Vocabulary & Native Pronunciation"
      description="Trung tâm luyện phát âm, học từ vựng chuyên ngành tiếng Anh và thẻ ghi nhớ 3D (Flashcards) dành cho kỹ sư phần mềm, lập trình viên Backend, Frontend và DevOps."
    >
      <div
        className="tech-english-page-container"
        style={{
          minHeight: '100vh',
          background: 'var(--page-bg, #090d16)',
          padding: '32px 16px 80px 16px',
          color: 'var(--ifm-color-content, #ffffff)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          {/* ======================================================== */}
          {/* HERO BANNER */}
          {/* ======================================================== */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              className="teh-hero-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '16px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <span>🗣️ ENGLISH FOR DEVELOPERS • PHÁT ÂM & TỪ VỰNG CHUYÊN NGÀNH</span>
            </div>

            <h1
              className="teh-hero-title"
              style={{
                fontSize: '2.75rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: '0 auto 14px auto',
                lineHeight: 1.25,
                display: 'block',
                width: 'fit-content',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tech English Hub & Flashcard Arena
            </h1>

            <p
              className="teh-hero-subtitle"
              style={{
                fontSize: '1.15rem',
                maxWidth: '820px',
                margin: '0 auto 24px auto',
                lineHeight: 1.6,
                color: '#94a3b8',
              }}
            >
              Luyện đọc, nghe, phát âm chuẩn xác và làm chủ 100% thuật ngữ kỹ thuật chuyên ngành từ tiếng Anh sang tiếng Việt. Kết hợp thẻ ghi nhớ 3D, giọng phát âm bản xứ Web Speech API và cẩm nang phỏng vấn Senior/Staff.
            </p>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {[
                { label: `${TECH_TERMS.length}+ Thuật Ngữ Kỹ Thuật`, desc: 'System Design • DB • OS • Network • Java • Security • DevOps', color: '#38bdf8' },
                { label: '3 Chế Độ Luyện Tập', desc: '3D Flashcards • Listening Quiz • Tra Cứu Từ Điển', color: '#34d399' },
                { label: 'Web Speech Native Audio', desc: 'Phát âm giọng bản xứ trực tiếp với 3 mức tốc độ', color: '#fbbf24' },
                { label: 'Senior Interview Playbook', desc: 'Mẫu câu phỏng vấn Staff/Principal & 5 bẫy kinh điển', color: '#a78bfa' },
              ].map((chip, i) => (
                <div
                  key={i}
                  className={`teh-metric-card teh-metric-${i}`}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '200px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span className="teh-metric-label" style={{ fontWeight: 800, color: chip.color }}>{chip.label}</span>
                  <span className="teh-metric-desc" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>{chip.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* MAIN NAVIGATION BAR */}
          {/* ======================================================== */}
          <div
            id="teh-main-nav"
            className="teh-main-nav"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '32px',
              paddingBottom: '16px',
              borderBottom: '1px solid #1e293b',
            }}
          >
            {[
              { id: 'flashcards', label: '🎴 Flashcard Arena', color: '#38bdf8' },
              { id: 'quiz', label: '🎯 Listening & Recall Quiz', color: '#34d399' },
              { id: 'dictionary', label: `📖 Tra Cứu Toàn Diện (${TECH_TERMS.length})`, color: '#38bdf8' },
              { id: 'traps', label: `⚠️ 10 Bẫy Phát Âm & Cặp Từ Dễ Nhầm`, color: '#fbbf24' },
              { id: 'playbook', label: '🧠 Senior Interview Playbook', color: '#a78bfa' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`teh-nav-tab tab-${tab.id} ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as EnglishTab)}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '14.5px',
                    border: isActive ? `1.5px solid ${tab.color}` : '1px solid #334155',
                    background: isActive ? `${tab.color}22` : '#0f172a',
                    color: isActive ? tab.color : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 4px 16px ${tab.color}40` : 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* TAB PANELS */}
          {/* ======================================================== */}

          {/* 1. FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div>
              <div className="teh-tab-hint" style={{ marginBottom: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                💡 <em>Mẹo: Nhấn phím <kbd className="teh-kbd" style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>Space</kbd> để lật thẻ, phím <kbd className="teh-kbd" style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>➔</kbd> và <kbd className="teh-kbd" style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>◀</kbd> để chuyển thẻ tiếp theo / trước đó.</em>
              </div>
              <TechGlossaryFlashcards initialMode="flashcards" />
            </div>
          )}

          {/* 2. QUIZ */}
          {activeTab === 'quiz' && (
            <div>
              <div className="teh-tab-hint" style={{ marginBottom: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                🎯 <em>Lắng nghe phát âm tiếng Anh và chọn định nghĩa tiếng Việt chuẩn xác nhất để củng cố phản xạ!</em>
              </div>
              <TechGlossaryFlashcards initialMode="quiz" />
            </div>
          )}

          {/* 3. DICTIONARY */}
          {activeTab === 'dictionary' && (
            <div>
              <div className="teh-tab-hint" style={{ marginBottom: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                📖 <em>Tra cứu nhanh toàn bộ 70+ thuật ngữ theo 7 danh mục kỹ thuật, kèm phát âm âm thanh và ví dụ kiến trúc.</em>
              </div>
              <TechGlossaryFlashcards initialMode="dictionary" />
            </div>
          )}

          {/* 4. PRONUNCIATION TRAPS & CONFUSION PAIRS */}
          {activeTab === 'traps' && (
            <div>
              {/* SECTION 4.1: 10 PRONUNCIATION TRAPS */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <h2 className="teh-section-title-amber" style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#fbbf24' }}>
                    10 Cạm Bẫy Phát Âm Kỹ Thuật Hay Mắc Nhất
                  </h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Bấm vào nút loa 🔊 bên cạnh mỗi từ để nghe phát âm tiếng Anh bản xứ chuẩn xác và sửa ngay những thói quen phát âm sai phổ biến:
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table
                    className="teh-traps-table"
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13.5px',
                      background: '#0d111e',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#0f172a', borderBottom: '2px solid #1e293b' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', width: '50px' }}>Audio</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Thuật Ngữ (Term)</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Phiên Âm IPA</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Phát Âm Đúng</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Lỗi Sai Cần Tránh</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Giải Thích Quy Tắc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRONUNCIATION_TRAPS.map((trap, idx) => (
                        <tr key={idx} className="teh-traps-row" style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '12px' }}>
                            <button
                              type="button"
                              className="teh-audio-btn"
                              onClick={() => speakWord(trap.term)}
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid #38bdf8',
                                color: '#38bdf8',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Nghe phát âm"
                            >
                              🔊
                            </button>
                          </td>
                          <td className="teh-trap-term" style={{ padding: '12px', fontWeight: 800, color: '#ffffff', fontSize: '15px' }}>
                            {trap.term}
                          </td>
                          <td className="teh-trap-ipa" style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>
                            {trap.ipa}
                          </td>
                          <td className="teh-trap-correct" style={{ padding: '12px', fontWeight: 700, color: '#34d399' }}>
                            ✅ {trap.vietnameseGuide}
                          </td>
                          <td className="teh-trap-wrong" style={{ padding: '12px', color: '#f87171' }}>
                            ❌ {trap.wrongGuide}
                          </td>
                          <td className="teh-trap-explain" style={{ padding: '12px', color: '#cbd5e1' }}>
                            {trap.explanation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4.2: CONFUSION PAIRS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⚖️</span>
                  <h2 className="teh-section-title-cyan" style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
                    Các Cặp Khái Niệm Chuyên Môn Dễ Nhầm Lẫn Nhất
                  </h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Dùng lẫn lộn các cặp khái niệm này sẽ khiến nhà tuyển dụng quốc tế đánh giá bạn chưa vững kiến trúc nền tảng:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {CONFUSION_PAIRS.map((pair, idx) => (
                    <div
                      key={idx}
                      className="teh-pair-card"
                      style={{
                        background: '#0d111e',
                        border: '1px solid #1e293b',
                        borderRadius: '10px',
                        padding: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="teh-pair-term-a" style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{pair.termA}</span>
                          <span className="teh-pair-vs" style={{ color: '#64748b', fontWeight: 700 }}>VS</span>
                          <span className="teh-pair-term-b" style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{pair.termB}</span>
                        </div>
                        <span className="teh-pair-badge" style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 600 }}>
                          {pair.diffSummary}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                        <div className="teh-pair-box-a" style={{ background: '#090b14', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                          <strong className="teh-pair-label-a" style={{ color: '#38bdf8', fontSize: '13px' }}>{pair.termA}:</strong>
                          <p className="teh-pair-detail" style={{ color: '#cbd5e1', fontSize: '12.5px', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                            {pair.detailA}
                          </p>
                        </div>
                        <div className="teh-pair-box-b" style={{ background: '#090b14', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                          <strong className="teh-pair-label-b" style={{ color: '#34d399', fontSize: '13px' }}>{pair.termB}:</strong>
                          <p className="teh-pair-detail" style={{ color: '#cbd5e1', fontSize: '12.5px', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                            {pair.detailB}
                          </p>
                        </div>
                      </div>

                      <div className="teh-pair-code" style={{ background: '#090b14', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', color: '#93c5fd', whiteSpace: 'pre-wrap' }}>
                        {pair.codeOrExample}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. SENIOR PLAYBOOK */}
          {activeTab === 'playbook' && (
            <div>
              <div className="teh-playbook-card" style={{ background: '#0d111e', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>🧠</span>
                  <h2 className="teh-section-title-purple" style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#a78bfa' }}>
                    The Senior Framing Strategy (First 60 Seconds in English)
                  </h2>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                  Khi phỏng vấn thiết kế hệ thống bằng tiếng Anh, hãy mở đầu câu trả lời bằng 4 công thức định hình kiến trúc sau đây để ghi điểm tuyệt đối:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="teh-framing-box teh-framing-1" style={{ background: '#090b14', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                    <div className="teh-framing-title-1" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>1. Establish Boundaries & Invariants</div>
                    <div className="teh-framing-quote" style={{ color: '#e2e8f0', fontSize: '13px', fontStyle: 'italic', marginTop: '6px' }}>
                      "Before diving into the architecture, I'd like to clarify our physical invariants: Are we optimizing for low write latency or strict serializability?"
                    </div>
                  </div>

                  <div className="teh-framing-box teh-framing-2" style={{ background: '#090b14', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                    <div className="teh-framing-title-2" style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>2. Back-of-the-envelope Capacity Math</div>
                    <div className="teh-framing-quote" style={{ color: '#e2e8f0', fontSize: '13px', fontStyle: 'italic', marginTop: '6px' }}>
                      "Based on Little's Law (L = λ × W), with an ingress rate of 5,000 req/s and downstream latency of 50ms, our required worker concurrency footprint is 250."
                    </div>
                  </div>

                  <div className="teh-framing-box teh-framing-3" style={{ background: '#090b14', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #fbbf24' }}>
                    <div className="teh-framing-title-3" style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>3. Articulate Honest Trade-offs</div>
                    <div className="teh-framing-quote" style={{ color: '#e2e8f0', fontSize: '13px', fontStyle: 'italic', marginTop: '6px' }}>
                      "While an asynchronous event-driven model maximizes throughput, the caveat is eventual consistency and complex operational reconciliation."
                    </div>
                  </div>

                  <div className="teh-framing-box teh-framing-4" style={{ background: '#090b14', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #a78bfa' }}>
                    <div className="teh-framing-title-4" style={{ color: '#a78bfa', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>4. Proactive Failure Isolation</div>
                    <div className="teh-framing-quote" style={{ color: '#e2e8f0', fontSize: '13px', fontStyle: 'italic', marginTop: '6px' }}>
                      "To prevent cascading failures under downstream degradation, we should establish a bounded bulkhead and fail fast via circuit breakers."
                    </div>
                  </div>
                </div>
              </div>

              {/* PHRASING UPGRADES TABLE */}
              <div className="teh-playbook-card" style={{ background: '#0d111e', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
                <h3 className="teh-section-title-cyan" style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginBottom: '16px' }}>
                  Mid-Level vs. Principal Candidate English Phrasing Cheat Sheet
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table className="teh-playbook-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', borderBottom: '2px solid #1e293b' }}>
                        <th className="teh-th-topic" style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', width: '22%' }}>Scenario / Topic</th>
                        <th className="teh-th-mid" style={{ padding: '12px', textAlign: 'left', color: '#f87171', width: '38%' }}>Mid-Level Candidate Says</th>
                        <th className="teh-th-principal" style={{ padding: '12px', textAlign: 'left', color: '#34d399', width: '40%' }}>Principal Candidate Demonstrates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          topic: 'Describing Performance',
                          mid: '"This database is very fast and has good speed."',
                          principal: '"This storage engine achieves sub-millisecond p99 read latency by eliminating disk seeks via memory-mapped sequential writes."',
                        },
                        {
                          topic: 'Explaining Failures',
                          mid: '"If the server goes down, we will restart it."',
                          principal: '"We isolate failure domains using graceful degradation, circuit breakers, and bounded retries with exponential backoff and full jitter."',
                        },
                        {
                          topic: 'Network Retries',
                          mid: '"The client can just call the API again if it fails."',
                          principal: '"Because network timeouts are ambiguous, the mutation endpoint must enforce idempotency via unique idempotency keys backed by database constraints."',
                        },
                        {
                          topic: 'Data Synchronization',
                          mid: '"The data will sync between servers soon."',
                          principal: '"The cluster adopts an eventual consistency model; replicas converge monotonically within an acceptable replication lag window."',
                        },
                        {
                          topic: 'Handling Overload',
                          mid: '"We will increase thread pool size to handle more requests."',
                          principal: '"Bumping thread pools without expanding downstream bulkheads causes thread exhaustion and connection starvation. We should enforce reactive backpressure."',
                        },
                      ].map((row, idx) => (
                        <tr key={idx} className="teh-playbook-row" style={{ borderBottom: '1px solid #1e293b' }}>
                          <td className="teh-col-topic" style={{ padding: '12px', fontWeight: 700, color: '#ffffff' }}>{row.topic}</td>
                          <td className="teh-col-mid" style={{ padding: '12px', color: '#fca5a5', fontStyle: 'italic' }}>{row.mid}</td>
                          <td className="teh-col-principal" style={{ padding: '12px', color: '#86efac', fontWeight: 600 }}>{row.principal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="teh-cta-btn"
                    onClick={() => {
                      setActiveTab('flashcards');
                      const navEl = document.getElementById('teh-main-nav');
                      if (navEl) navEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Luyện Tập Thẻ 3D Flashcards Ngay ➔
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
