import React, { useState, useMemo, useEffect } from 'react';
import {
  InterviewQuestionItem,
  DOMAINS_META,
  getInterview5120Questions,
  DomainMeta
} from '@site/src/data/interviewQuestions5120Data';

export default function SeniorInterview5120Suite(): React.ReactElement {
  const allQuestions = useMemo(() => getInterview5120Questions(), []);

  // Filter States
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Bookmarks & Mastered
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [mastered, setMastered] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'mock' | 'saved' | 'mastered'>('all');

  // Mock Interview State
  const [mockCount, setMockCount] = useState<number>(10);
  const [mockQuestions, setMockQuestions] = useState<InterviewQuestionItem[]>([]);
  const [mockActive, setMockActive] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(45 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedBm = localStorage.getItem('senior_interview_5120_bookmarks');
      if (savedBm) setBookmarks(JSON.parse(savedBm));
      const savedMast = localStorage.getItem('senior_interview_5120_mastered');
      if (savedMast) setMastered(JSON.parse(savedMast));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('senior_interview_5120_bookmarks', JSON.stringify(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  const toggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMastered((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('senior_interview_5120_mastered', JSON.stringify(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startMockInterview = () => {
    let candidatePool = allQuestions;
    if (selectedDomain !== 'ALL') {
      candidatePool = candidatePool.filter((q) => q.domainCode === selectedDomain);
    }
    if (selectedCategory !== 'ALL') {
      candidatePool = candidatePool.filter((q) => q.category === selectedCategory);
    }
    const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
    setMockQuestions(shuffled.slice(0, mockCount));
    setMockActive(true);
    setTimerSeconds(mockCount * 4 * 60); // 4 minutes per question
    setTimerRunning(true);
    setActiveTab('mock');
  };

  // Filtered List
  const filteredQuestions = useMemo(() => {
    let list = allQuestions;

    if (activeTab === 'saved') {
      list = list.filter((q) => bookmarks[q.id]);
    } else if (activeTab === 'mastered') {
      list = list.filter((q) => mastered[q.id]);
    } else if (activeTab === 'mock') {
      return mockQuestions;
    }

    if (selectedDomain !== 'ALL') {
      list = list.filter((q) => q.domainCode === selectedDomain);
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter((q) => q.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      list = list.filter(
        (q) =>
          q.id.toLowerCase().includes(qLower) ||
          q.question.toLowerCase().includes(qLower) ||
          q.theme.toLowerCase().includes(qLower) ||
          q.scenarioContext.toLowerCase().includes(qLower) ||
          q.seniorSolution.toLowerCase().includes(qLower) ||
          q.tags.some((t) => t.toLowerCase().includes(qLower))
      );
    }

    return list;
  }, [allQuestions, activeTab, bookmarks, mastered, mockQuestions, selectedDomain, selectedCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Export Markdown
  const exportMarkdown = () => {
    const questionsToExport = activeTab === 'mock' ? mockQuestions : paginatedQuestions;
    const md = questionsToExport
      .map(
        (q, idx) => `### ${idx + 1}. [${q.id}] ${q.question}
**Phân loại:** ${q.category} | **Lĩnh vực:** ${q.domain} (${q.domainCode})
**Chủ đề:** ${q.theme}

**🏢 Bối Cảnh Production:**
${q.scenarioContext}

**⚠️ Bẫy Junior/Mid Thường Mắc Phải:**
${q.juniorTrap}

**🧠 Lập Luận & Giải Pháp của Principal/Senior:**
${q.seniorSolution}

**💻 Code / Lệnh Kiểm Chứng Thực Tế:**
\`\`\`
${q.practicalProof}
\`\`\`
`
      )
      .join('\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `senior-interview-5120-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="senior-interview-5120-container" style={{ padding: '1.5rem 0' }}>
      {/* Hero Header */}
      <div
        className="si5120-hero"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🧠</span>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>
            128 Câu Hỏi Phỏng Vấn Kỹ Sư Thực Chiến Tinh Hoa
          </h1>
        </div>
        <p style={{ margin: 0, color: 'var(--ifm-color-content-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Ngân hàng <strong>128 câu hỏi kỹ thuật chuyên sâu tuyển chọn</strong>, phân bổ đều cho 8 trụ cột công nghệ cốt lõi (16 câu/trụ cột: 8 Thực Hành + 8 Phân Tích Sự Cố).
          Triệt tiêu 100% trùng lặp, đi thẳng vào bản chất engine, phân tích đánh đổi kiến trúc (trade-offs) theo tiêu chuẩn <strong>Senior, Staff &amp; Principal Engineer</strong>.
        </p>

        {/* High-Level Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}
        >
          <div
            style={{
              background: 'var(--ifm-card-background-color, #ffffff)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>{allQuestions.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              Tổng Số Câu Hỏi Tinh Hoa
            </div>
          </div>
          <div
            style={{
              background: 'var(--ifm-card-background-color, #ffffff)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0ea5e9' }}>8 Trụ Cột</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              16 Câu Mỗi Công Nghệ
            </div>
          </div>
          <div
            style={{
              background: 'var(--ifm-card-background-color, #ffffff)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>64 Câu</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              🛠️ Thực Hành &amp; Áp Dụng
            </div>
          </div>
          <div
            style={{
              background: 'var(--ifm-card-background-color, #ffffff)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>64 Câu</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              🔬 Phân Tích &amp; Điều Tra
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '2px solid var(--ifm-color-emphasis-200, #e2e8f0)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'all' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'all' ? '#ffffff' : 'var(--ifm-color-content)'
          }}
        >
          📚 Ngân Hàng Câu Hỏi ({allQuestions.length.toLocaleString()})
        </button>
        <button
          onClick={() => setActiveTab('mock')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'mock' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'mock' ? '#ffffff' : 'var(--ifm-color-content)'
          }}
        >
          ⏱️ Giả Lập Phỏng Vấn {mockActive && `(${mockQuestions.length} câu)`}
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'saved' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'saved' ? '#ffffff' : 'var(--ifm-color-content)'
          }}
        >
          ⭐ Đã Đánh Dấu ({Object.values(bookmarks).filter(Boolean).length})
        </button>
        <button
          onClick={() => setActiveTab('mastered')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: activeTab === 'mastered' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'mastered' ? '#ffffff' : 'var(--ifm-color-content)'
          }}
        >
          ✅ Đã Thuần Thục ({Object.values(mastered).filter(Boolean).length})
        </button>
      </div>

      {/* Mock Interview Generator Bar */}
      {activeTab === 'mock' && (
        <div
          style={{
            background: 'var(--ifm-card-background-color, #ffffff)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '2px solid #8b5cf6',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>Số lượng câu hỏi:</span>
              <select
                value={mockCount}
                onChange={(e) => setMockCount(Number(e.target.value))}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value={5}>5 câu (Nhanh - 20 phút)</option>
                <option value={10}>10 câu (Chuẩn - 40 phút)</option>
                <option value={15}>15 câu (Chuyên sâu - 60 phút)</option>
                <option value={20}>20 câu (Toàn diện - 80 phút)</option>
              </select>
            </div>
            <button
              onClick={startMockInterview}
              style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🎲 Tạo Bộ Đề Mới
            </button>
          </div>

          {mockActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: timerSeconds < 300 ? '#ef4444' : '#10b981',
                  background: 'rgba(0,0,0,0.06)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px'
                }}
              >
                ⏳ {formatTimer(timerSeconds)}
              </div>
              <button
                onClick={() => setTimerRunning((prev) => !prev)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
                  background: 'transparent',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--ifm-color-content)'
                }}
              >
                {timerRunning ? 'Tạm Dừng' : 'Tiếp Tục'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8 Domains Grid Filter */}
      {activeTab !== 'mock' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Chọn Trụ Cột Kỹ Thuật (16 Câu Mỗi Trụ Cột):</span>
            {selectedDomain !== 'ALL' && (
              <button
                onClick={() => setSelectedDomain('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b5cf6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✕ Xóa bộ lọc trụ cột
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.75rem'
            }}
          >
            <div
              onClick={() => setSelectedDomain('ALL')}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: selectedDomain === 'ALL' ? '2px solid #8b5cf6' : '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
                background: selectedDomain === 'ALL' ? 'rgba(139, 92, 246, 0.1)' : 'var(--ifm-card-background-color, #ffffff)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>🌐</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tất Cả 8 Trụ Cột</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ifm-color-content-secondary)' }}>{allQuestions.length} Câu Hỏi</div>
              </div>
            </div>

            {DOMAINS_META.map((dm: DomainMeta) => {
              const isSel = selectedDomain === dm.shortCode;
              return (
                <div
                  key={dm.shortCode}
                  onClick={() => setSelectedDomain(dm.shortCode)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: isSel ? `2px solid ${dm.accentColor}` : '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
                    background: isSel ? `${dm.accentColor}18` : 'var(--ifm-card-background-color, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{dm.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dm.domain}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ifm-color-content-secondary)' }}>
                      {dm.totalCount} câu ({dm.applyingCount} Áp dụng + {dm.analyzingCount} Phân tích)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ifm-card-background-color, #ffffff)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
          marginBottom: '1.5rem'
        }}
      >
        {/* Category Pill Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setCurrentPage(1);
            }}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
              background: selectedCategory === 'ALL' ? '#8b5cf6' : 'transparent',
              color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--ifm-color-content)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Tất Cả Phân Loại
          </button>
          <button
            onClick={() => {
              setSelectedCategory('Thực Hành & Áp Dụng');
              setCurrentPage(1);
            }}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: '1px solid #10b981',
              background: selectedCategory === 'Thực Hành & Áp Dụng' ? '#10b981' : 'transparent',
              color: selectedCategory === 'Thực Hành & Áp Dụng' ? '#ffffff' : 'var(--ifm-color-content)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🛠️ Thực Hành &amp; Áp Dụng (64)
          </button>
          <button
            onClick={() => {
              setSelectedCategory('Phân Tích & Điều Tra Sự Cố');
              setCurrentPage(1);
            }}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: '1px solid #f59e0b',
              background: selectedCategory === 'Phân Tích & Điều Tra Sự Cố' ? '#f59e0b' : 'transparent',
              color: selectedCategory === 'Phân Tích & Điều Tra Sự Cố' ? '#ffffff' : 'var(--ifm-color-content)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🔬 Phân Tích &amp; Điều Tra (64)
          </button>
        </div>

        {/* Search Field */}
        <div style={{ flex: '1 1 250px' }}>
          <input
            type="text"
            placeholder="Tìm theo mã (Q-JAVA-APP-001), từ khóa, kịch bản, lỗi..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
              background: 'transparent',
              color: 'var(--ifm-color-content)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Export Button */}
        <button
          onClick={exportMarkdown}
          title="Tải câu hỏi về máy dưới dạng Markdown"
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: '1px solid #8b5cf6',
            background: 'transparent',
            color: '#8b5cf6',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          📥 Xuất Markdown
        </button>
      </div>

      {/* Results Count & Current Filter Summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: 'var(--ifm-color-content-secondary)'
        }}
      >
        <div>
          Hiển thị <strong>{filteredQuestions.length.toLocaleString()}</strong> câu hỏi phù hợp
          {selectedDomain !== 'ALL' && ` • Trụ cột: ${selectedDomain}`}
          {selectedCategory !== 'ALL' && ` • Phân loại: ${selectedCategory}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Trang:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            <option value={10}>10 câu/trang</option>
            <option value={20}>20 câu/trang</option>
            <option value={50}>50 câu/trang</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginatedQuestions.map((q) => {
          const isExpanded = expandedId === q.id;
          const isSaved = bookmarks[q.id];
          const isMast = mastered[q.id];

          return (
            <div
              key={q.id}
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
              style={{
                background: 'var(--ifm-card-background-color, #ffffff)',
                borderRadius: '12px',
                border: isExpanded ? '2px solid #8b5cf6' : '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isExpanded ? '0 4px 16px rgba(139, 92, 246, 0.12)' : 'none'
              }}
            >
              {/* Question Header Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* ID Pill */}
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#8b5cf6',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px'
                    }}
                  >
                    {q.id}
                  </span>

                  {/* Category Pill */}
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: q.category === 'Thực Hành & Áp Dụng' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: q.category === 'Thực Hành & Áp Dụng' ? '#10b981' : '#d97706'
                    }}
                  >
                    {q.category}
                  </span>

                  {/* Domain Tag */}
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--ifm-color-content-secondary)'
                    }}
                  >
                    {q.domain}
                  </span>
                </div>

                {/* Bookmark & Mastered Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => toggleBookmark(q.id, e)}
                    title={isSaved ? 'Hủy lưu câu hỏi' : 'Lưu câu hỏi này'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.15rem',
                      padding: '0.2rem',
                      color: isSaved ? '#f59e0b' : 'var(--ifm-color-emphasis-400, #94a3b8)'
                    }}
                  >
                    {isSaved ? '★' : '☆'}
                  </button>
                  <button
                    onClick={(e) => toggleMastered(q.id, e)}
                    title={isMast ? 'Đánh dấu chưa thuộc' : 'Đã nắm vững câu này'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.15rem',
                      padding: '0.2rem',
                      color: isMast ? '#10b981' : 'var(--ifm-color-emphasis-400, #94a3b8)'
                    }}
                  >
                    {isMast ? '✅' : '⚪'}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--ifm-color-content)',
                  lineHeight: 1.5,
                  marginBottom: '0.5rem'
                }}
              >
                {q.question}
              </div>

              {/* Theme line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.82rem',
                  color: 'var(--ifm-color-content-secondary)'
                }}
              >
                <span>Chủ đề: <strong>{q.theme}</strong></span>
              </div>

              {/* Expanded Deep Dive Panel */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Scenario Context */}
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      borderLeft: '4px solid #0ea5e9'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0ea5e9', marginBottom: '0.25rem' }}>
                      🏢 BỐI CẢNH PRODUCTION &amp; THÁCH THỨC HỆ THỐNG
                    </div>
                    <div style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{q.scenarioContext}</div>
                  </div>

                  {/* Junior Trap */}
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      borderLeft: '4px solid #ef4444'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.25rem' }}>
                      ⚠️ BẪY ỨNG VIÊN JUNIOR/MID HAY MẮC PHẢI
                    </div>
                    <div style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{q.juniorTrap}</div>
                  </div>

                  {/* Senior Deep Dive Solution */}
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      borderLeft: '4px solid #10b981'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981', marginBottom: '0.25rem' }}>
                      🧠 LẬP LUẬN &amp; GIẢI PHÁP CỦA PRINCIPAL / SENIOR ENGINEER
                    </div>
                    <div style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{q.seniorSolution}</div>
                  </div>

                  {/* Code Proof */}
                  <div
                    style={{
                      background: '#0d1117',
                      color: '#e6edf3',
                      padding: '1rem',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      overflowX: 'auto',
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ color: '#8b949e', fontSize: '0.78rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                      // CODE MINH CHỨNG &amp; LỆNH THỰC THI CHUẨN XÁC
                    </div>
                    <pre style={{ margin: 0, padding: 0, background: 'transparent', color: 'inherit' }}>
                      <code>{q.practicalProof}</code>
                    </pre>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.75rem',
                          background: 'var(--ifm-color-emphasis-100, #f1f5f9)',
                          color: 'var(--ifm-color-content-secondary)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '2rem'
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
              background: 'transparent',
              color: 'var(--ifm-color-content)',
              fontWeight: 600,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            ← Trang Trước
          </button>
          <span style={{ margin: '0 0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
              background: 'transparent',
              color: 'var(--ifm-color-content)',
              fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Trang Sau →
          </button>
        </div>
      )}
    </div>
  );
}
