import React, { useState, useMemo, useCallback } from 'react';
import Layout from '@theme/Layout';
import TechGlossaryFlashcards, { TECH_TERMS } from '../../components/TechGlossaryFlashcards';
import { TECH_ACRONYMS_DATA, TechAcronym } from '../../data/techAcronymsData';

type EnglishTab = 'arena' | 'acronyms' | 'traps';

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
    codeOrExample: '// Concurrency: 1 chef stirring 5 pots on 1 stove (Interleaving)\n// Parallelism: 5 chefs on 5 stoves (Hardware execution)',
  },
  {
    termA: 'Latency',
    termB: 'Throughput',
    diffSummary: 'Latency là độ trễ của 1 request (ms) vs Throughput là số request xong trong 1 giây (RPS)',
    detailA: 'Thời gian cần thiết để một tín hiệu hoặc gói tin truyền từ Client tới Server và phản hồi (Round-Trip Time). Đo bằng p95, p99 ms.',
    detailB: 'Tổng khối lượng công việc hệ thống hoàn thành trong 1 đơn vị thời gian (Requests Per Second - RPS). Định luật Little liên kết cả hai: L = λ × W.',
    codeOrExample: '// Low Latency: API returns in 10ms\n// High Throughput: API handles 50,000 requests/second',
  },
  {
    termA: 'Synchronous',
    termB: 'Blocking',
    diffSummary: 'Sync là cơ chế nhận kết quả đồng nhịp vs Blocking là trạng thái Thread ngủ trên OS',
    detailA: 'Người gọi phát lệnh và không thể tiếp tục cho tới khi nhận được kết quả trực tiếp từ người nhận (Lockstep execution).',
    detailB: 'Hệ điều hành đưa Thread gọi lệnh vào trạng thái ngủ (BLOCKED/WAITING), gỡ khỏi CPU và lưu registers, chờ I/O hoàn tất.',
    codeOrExample: '// You can be Asynchronous but Blocking if you call future.get()!\n// You can be Synchronous but Non-blocking via polling.',
  },
  {
    termA: 'Scalability',
    termB: 'Elasticity',
    diffSummary: 'Scalability là năng lực chịu tải khi nâng cấp phần cứng vs Elasticity là tự co giãn theo nhu cầu tức thời',
    detailA: 'Khả năng của hệ thống tăng trưởng năng suất tỷ lệ thuận khi bổ sung thêm tài nguyên phần cứng (Scale Up RAM/CPU hoặc Scale Out thêm node).',
    detailB: 'Khả năng của hệ thống tự động cấp phát hoặc thu hồi tài nguyên (Auto-scaling pods/VMs) tương ứng với lưu lượng tải tăng giảm theo thời gian thực.',
    codeOrExample: '// Scalability: Adding 10 Kafka brokers doubles message capacity\n// Elasticity: Kubernetes HPA scales pods from 2 to 20 during flash-sale',
  },
];

export default function TechEnglishHubPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<EnglishTab>('arena');

  // Acronyms state
  const [acronymSearch, setAcronymSearch] = useState<string>('');
  const [acronymCategory, setAcronymCategory] = useState<string>('all');

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

  // Filtered acronyms
  const filteredAcronyms = useMemo(() => {
    return TECH_ACRONYMS_DATA.filter((item) => {
      if (acronymCategory !== 'all' && item.category !== acronymCategory) {
        return false;
      }
      if (acronymSearch.trim()) {
        const q = acronymSearch.toLowerCase();
        const matchesAcronym = item.acronym.toLowerCase().includes(q);
        const matchesFull = item.fullForm.toLowerCase().includes(q);
        const matchesMeaning = item.meaning.toLowerCase().includes(q);
        const matchesPronun = item.pronunciation.toLowerCase().includes(q);
        return matchesAcronym || matchesFull || matchesMeaning || matchesPronun;
      }
      return true;
    });
  }, [acronymCategory, acronymSearch]);

  return (
    <Layout
      title="Tech English Hub — Master English Technical Vocabulary, Acronyms & Native Pronunciation"
      description="Trung tâm luyện phát âm, học từ vựng và từ viết tắt (Acronyms) chuyên ngành tiếng Anh dành cho kỹ sư phần mềm, lập trình viên Backend, Frontend và DevOps."
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
              <span>🗣️ ENGLISH FOR DEVELOPERS • PHÁT ÂM, TỪ VỰNG & TỪ VIẾT TẮT</span>
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
                maxWidth: '840px',
                margin: '0 auto 24px auto',
                lineHeight: 1.6,
                color: '#94a3b8',
              }}
            >
              Luyện đọc, nghe, phát âm chuẩn xác và làm chủ 100% thuật ngữ và từ viết tắt (Acronyms) kỹ thuật chuyên ngành từ tiếng Anh sang tiếng Việt. Tích hợp thẻ ghi nhớ 3D, giọng phát âm bản xứ Web Speech API và cẩm nang bẫy phát âm.
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
                { label: `${TECH_ACRONYMS_DATA.length}+ Từ Viết Tắt (Acronyms)`, desc: 'Giải nghĩa chuyên sâu & hướng dẫn đọc chuẩn quốc tế', color: '#34d399' },
                { label: '3 Chế Độ Luyện Tập', desc: '3D Flashcards • Listening Quiz • Tra Cứu Từ Điển', color: '#fbbf24' },
                { label: '10 Bẫy Phát Âm & 5 Cặp Dễ Nhầm', desc: 'Sửa lỗi phát âm sai và phân biệt khái niệm cốt lõi', color: '#a78bfa' },
              ].map((chip, i) => (
                <div
                  key={i}
                  className={`teh-metric-card teh-metric-${i}`}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '180px',
                  }}
                >
                  <span className="teh-metric-label" style={{ fontWeight: 800 }}>{chip.label}</span>
                  <span className="teh-metric-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>{chip.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* MAIN NAVIGATION BAR (Streamlined - No Duplicate Bars) */}
          {/* ======================================================== */}
          <div
            id="teh-main-nav"
            className="teh-main-nav"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '32px',
              paddingBottom: '16px',
              borderBottom: '1px solid #1e293b',
            }}
          >
            {[
              { id: 'arena', label: `🎴 Luyện Từ Vựng & Quiz (${TECH_TERMS.length})`, color: '#38bdf8' },
              { id: 'acronyms', label: `🔤 Từ Viết Tắt & Acronyms (${TECH_ACRONYMS_DATA.length})`, color: '#34d399' },
              { id: 'traps', label: `⚠️ 10 Bẫy Phát Âm & Cặp Từ Dễ Nhầm`, color: '#fbbf24' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`teh-nav-tab tab-${tab.id} ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as EnglishTab)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '15px',
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

          {/* 1. UNIFIED VOCABULARY ARENA (Flashcards + Quiz + Dictionary) */}
          {activeTab === 'arena' && (
            <div>
              <div className="teh-tab-hint" style={{ marginBottom: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                💡 <em>Chuyển đổi linh hoạt giữa <strong>3D Flashcards</strong>, <strong>Listening Quiz</strong> và <strong>Tra Cứu Từ Điển</strong> ngay trên thanh điều khiển của thẻ bên dưới.</em>
              </div>
              <TechGlossaryFlashcards initialMode="flashcards" />
            </div>
          )}

          {/* 2. COMPREHENSIVE ACRONYMS & ABBREVIATIONS EXPLORER */}
          {activeTab === 'acronyms' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🔤</span>
                  <h2 className="teh-section-title-cyan" style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#34d399' }}>
                    Từ Điển Từ Viết Tắt & Acronyms Chuyên Ngành ({TECH_ACRONYMS_DATA.length})
                  </h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                  Tra cứu nghĩa đầy đủ, cách phát âm chuẩn quốc tế và lưu ý kiến trúc thực tế của hơn 120 từ viết tắt công nghệ. Bấm vào nút loa 🔊 để nghe phát âm tiếng Anh bản xứ.
                </p>
              </div>

              {/* Filter & Search Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: '20px',
                  background: '#0d111e',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #1e293b',
                }}
              >
                <div style={{ flex: '1', minWidth: '240px' }}>
                  <input
                    type="text"
                    className="teh-filter-input"
                    placeholder="🔍 Tìm theo từ viết tắt (ACID, CAP, K8s, JWT, CORS...)"
                    value={acronymSearch}
                    onChange={(e) => setAcronymSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#090b14',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <select
                    className="teh-filter-select"
                    value={acronymCategory}
                    onChange={(e) => setAcronymCategory(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      background: '#090b14',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">🌐 Tất Cả Danh Mục ({TECH_ACRONYMS_DATA.length})</option>
                    <option value="system-design">🏗️ System Design & Distributed</option>
                    <option value="database">💾 Databases & Storage</option>
                    <option value="os-concurrency">⚡ OS & Concurrency</option>
                    <option value="networking">🌐 Networking & Protocols</option>
                    <option value="java-jvm">☕ Java & JVM</option>
                    <option value="security">🛡️ Security & Auth</option>
                    <option value="devops">🔄 DevOps & Cloud</option>
                  </select>
                </div>

                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                  Hiển thị: <strong style={{ color: '#34d399' }}>{filteredAcronyms.length}</strong> / {TECH_ACRONYMS_DATA.length} từ
                </div>
              </div>

              {/* Acronyms Table */}
              <div style={{ overflowX: 'auto' }}>
                <table
                  className="teh-acronyms-table"
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13.5px',
                    background: '#0d111e',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #1e293b',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '2px solid #1e293b' }}>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', width: '56px' }}>Audio</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', width: '130px' }}>Viết Tắt (Acronym)</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', width: '240px' }}>Tên Tiếng Anh Đầy Đủ</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', width: '180px' }}>Cách Phát Âm Chuẩn</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Ý Nghĩa & Bản Chất Kỹ Thuật</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', width: '260px' }}>Lưu Ý Thực Tế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAcronyms.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                          Không tìm thấy từ viết tắt nào khớp với từ khóa "{acronymSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredAcronyms.map((item: TechAcronym) => (
                        <tr key={item.id} className="teh-acronym-row" style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="teh-audio-btn"
                              onClick={() => speakWord(item.fullForm)}
                              style={{
                                background: 'rgba(52, 211, 153, 0.15)',
                                border: '1px solid #34d399',
                                color: '#34d399',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title={`Nghe phát âm: ${item.fullForm}`}
                            >
                              🔊
                            </button>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              className="teh-acronym-badge"
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                fontSize: '14.5px',
                              }}
                            >
                              {item.acronym}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              {item.categoryLabel}
                            </div>
                          </td>
                          <td className="teh-acronym-full" style={{ padding: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                            {item.fullForm}
                          </td>
                          <td className="teh-acronym-pronun" style={{ padding: '12px', color: '#fbbf24', fontSize: '13px' }}>
                            🗣️ {item.pronunciation}
                          </td>
                          <td className="teh-acronym-meaning" style={{ padding: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                            {item.meaning}
                          </td>
                          <td className="teh-acronym-tip" style={{ padding: '12px', color: '#a78bfa', fontSize: '12.5px', lineHeight: 1.5 }}>
                            ⚡ {item.productionTip}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PRONUNCIATION TRAPS & CONFUSION PAIRS */}
          {activeTab === 'traps' && (
            <div>
              {/* SECTION 3.1: 10 PRONUNCIATION TRAPS */}
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

              {/* SECTION 3.2: CONFUSION PAIRS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⚖️</span>
                  <h2 className="teh-section-title-cyan" style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
                    Các Cặp Khái Niệm Chuyên Môn Dễ Nhầm Lẫn Nhất
                  </h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Dùng lẫn lộn các cặp khái niệm này sẽ khiến đồng nghiệp và nhà tuyển dụng quốc tế đánh giá bạn chưa nắm vững kiến trúc nền tảng:
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
        </div>
      </div>
    </Layout>
  );
}
