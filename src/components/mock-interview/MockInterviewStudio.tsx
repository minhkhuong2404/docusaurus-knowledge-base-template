import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MOCK_INTERVIEW_QUESTIONS,
  MockInterviewQuestion
} from '../../data/mockInterviewQuestionsData';
import {
  evaluateMockAnswer,
  EvaluationResult
} from '../../utils/mockInterviewEvaluator';

type InterviewPhase = 'SETUP' | 'INTERVIEWING' | 'EVALUATED' | 'SUMMARY';

interface AnswerRecord {
  question: MockInterviewQuestion;
  userAnswer: string;
  evaluation: EvaluationResult;
  timeSpentSeconds: number;
}

interface MockInterviewStudioProps {
  onSwitchTab?: (tab: string) => void;
}

export default function MockInterviewStudio({ onSwitchTab }: MockInterviewStudioProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  // Session Configuration State
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [activeSetupTab, setActiveSetupTab] = useState<'config' | 'bank'>('config');
  const [bankSearchKeyword, setBankSearchKeyword] = useState<string>('');
  const [expandedBankQuestionId, setExpandedBankQuestionId] = useState<string | null>(null);

  // Active Session State
  const [phase, setPhase] = useState<InterviewPhase>('SETUP');
  const [sessionQuestions, setSessionQuestions] = useState<MockInterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentUserAnswer, setCurrentUserAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showFullOutlineInEval, setShowFullOutlineInEval] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Results History State
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [answersHistory, setAnswersHistory] = useState<AnswerRecord[]>([]);
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (phase === 'INTERVIEWING') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);

  // Format Timer mm:ss
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timerSeconds]);

  // Current Question
  const currentQuestion: MockInterviewQuestion | undefined = sessionQuestions[currentIndex];

  // Start Session with Random Questions
  const handleStartSession = () => {
    let pool = [...MOCK_INTERVIEW_QUESTIONS];

    if (selectedTopic !== 'ALL') {
      pool = pool.filter((q) => q.topic === selectedTopic);
    }

    if (selectedLevel !== 'ALL') {
      pool = pool.filter((q) => q.level === selectedLevel);
    }

    // Shuffle pool
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (selected.length === 0) {
      alert('Không tìm thấy câu hỏi phù hợp với bộ lọc đã chọn! Vui lòng chọn lại.');
      return;
    }

    setSessionQuestions(selected);
    setCurrentIndex(0);
    setCurrentUserAnswer('');
    setShowHint(false);
    setShowFullOutlineInEval(false);
    setTimerSeconds(0);
    setAnswersHistory([]);
    setCurrentEvaluation(null);
    setPhase('INTERVIEWING');
  };

  // Start Single Question Practice directly from Bank
  const handleStartSingleQuestion = (question: MockInterviewQuestion) => {
    setSessionQuestions([question]);
    setCurrentIndex(0);
    setCurrentUserAnswer('');
    setShowHint(false);
    setShowFullOutlineInEval(false);
    setTimerSeconds(0);
    setAnswersHistory([]);
    setCurrentEvaluation(null);
    setPhase('INTERVIEWING');
  };

  // Submit Answer for Evaluation
  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;

    if (!currentUserAnswer.trim()) {
      setSubmitError('Vui lòng nhập câu trả lời của bạn trước khi nộp bài, hoặc bấm "Bỏ qua câu này" nếu muốn chuyển câu tiếp theo.');
      return;
    }

    setSubmitError(null);
    setIsEvaluating(true);

    setTimeout(() => {
      try {
        const evaluation = evaluateMockAnswer(currentUserAnswer, currentQuestion);
        setCurrentEvaluation(evaluation);

        const record: AnswerRecord = {
          question: currentQuestion,
          userAnswer: currentUserAnswer,
          evaluation,
          timeSpentSeconds: timerSeconds
        };

        setAnswersHistory((prev) => [...prev, record]);
        setPhase('EVALUATED');
        if (typeof window !== 'undefined') {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        console.error('Failed to evaluate answer:', err);
        setSubmitError('Có lỗi xảy ra khi chấm điểm câu trả lời. Vui lòng bấm nộp lại!');
      } finally {
        setIsEvaluating(false);
      }
    }, 300);
  };

  // Move to Next Question or Summary
  const handleNextQuestion = () => {
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentUserAnswer('');
      setShowHint(false);
      setShowFullOutlineInEval(false);
      setTimerSeconds(0);
      setCurrentEvaluation(null);
      setPhase('INTERVIEWING');
    } else {
      setPhase('SUMMARY');
    }
  };

  // Skip Question
  const handleSkipQuestion = () => {
    if (!currentQuestion) return;

    const emptyEval = evaluateMockAnswer('', currentQuestion);
    const record: AnswerRecord = {
      question: currentQuestion,
      userAnswer: '(Ứng viên đã bỏ qua câu hỏi này)',
      evaluation: emptyEval,
      timeSpentSeconds: timerSeconds
    };

    setAnswersHistory((prev) => [...prev, record]);

    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentUserAnswer('');
      setShowHint(false);
      setShowFullOutlineInEval(false);
      setTimerSeconds(0);
      setCurrentEvaluation(null);
      setPhase('INTERVIEWING');
    } else {
      setPhase('SUMMARY');
    }
  };

  // Calculate Overall Summary Stats
  const summaryStats = useMemo(() => {
    if (answersHistory.length === 0) return { avgScore: 0, byTopic: {} };

    const total = answersHistory.reduce((acc, curr) => acc + curr.evaluation.score, 0);
    const avg = Math.round(total / answersHistory.length);

    const byTopic: Record<string, number> = {};
    const countByTopic: Record<string, number> = {};

    answersHistory.forEach((r) => {
      const top = r.question.topic;
      byTopic[top] = (byTopic[top] || 0) + r.evaluation.score;
      countByTopic[top] = (countByTopic[top] || 0) + 1;
    });

    const topicAvg: Record<string, number> = {};
    Object.keys(byTopic).forEach((t) => {
      topicAvg[t] = Math.round(byTopic[t] / countByTopic[t]);
    });

    return {
      avgScore: avg,
      byTopic: topicAvg
    };
  }, [answersHistory]);

  // Filtered Question Bank
  const filteredBankQuestions = useMemo(() => {
    return MOCK_INTERVIEW_QUESTIONS.filter((q) => {
      if (selectedTopic !== 'ALL' && q.topic !== selectedTopic) return false;
      if (selectedLevel !== 'ALL' && q.level !== selectedLevel) return false;
      if (bankSearchKeyword.trim()) {
        const kw = bankSearchKeyword.toLowerCase();
        const matchQ = q.question.toLowerCase().includes(kw);
        const matchPoints = q.coreKeyPoints.some((p) => p.pointText.toLowerCase().includes(kw));
        const matchAns = q.idealAnswer.toLowerCase().includes(kw);
        if (!matchQ && !matchPoints && !matchAns) return false;
      }
      return true;
    });
  }, [selectedTopic, selectedLevel, bankSearchKeyword]);

  return (
    <div ref={containerRef} className="mock-interview-studio-container" style={{ width: '100%' }}>
      {/* ======================================================== */}
      {/* 1. SETUP PHASE */}
      {/* ======================================================== */}
      {phase === 'SETUP' && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🎙️</span>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--ifm-color-content, #0f172a)' }}>
                  Phòng Phỏng Vấn Thử & AI Evaluator
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                  Mô phỏng phỏng vấn trực tiếp chuẩn Tech Lead • Chấm điểm & phân tích dàn ý tức thì
                </div>
              </div>
            </div>

            {/* Mode Toggle Buttons */}
            <div style={{ display: 'inline-flex', background: 'var(--ifm-color-emphasis-100, #f1f5f9)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveSetupTab('config')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSetupTab === 'config' ? '#0ea5e9' : 'transparent',
                  color: activeSetupTab === 'config' ? '#ffffff' : 'var(--ifm-color-content-secondary, #64748b)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ⚙️ Cấu Hình Mock Test
              </button>
              <button
                type="button"
                onClick={() => setActiveSetupTab('bank')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSetupTab === 'bank' ? '#0ea5e9' : 'transparent',
                  color: activeSetupTab === 'bank' ? '#ffffff' : 'var(--ifm-color-content-secondary, #64748b)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📚 Xem Dàn Ý & Ngân Hàng ({MOCK_INTERVIEW_QUESTIONS.length} Câu)
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--ifm-color-content-secondary, #475569)', fontSize: '14.5px', marginBottom: '24px', lineHeight: 1.6 }}>
            Ngân hàng câu hỏi được chắt lọc từ các kỳ phỏng vấn thực tế tại Viettel, VNPT, FPT, VNG, Momo, Shopee và các công ty công nghệ hàng đầu. Sau khi nộp câu trả lời, hệ thống sẽ đối soát với <strong>dàn ý các luận điểm trọng tâm</strong> để chấm điểm độ chuẩn xác.
          </p>

          {/* FILTER CONTROLS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Topic Filter */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
                Chủ đề phỏng vấn:
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                  background: 'var(--ifm-background-color, #f8fafc)',
                  color: 'var(--ifm-color-content, #0f172a)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">🌐 Tất Cả Chủ Đề (Tổng hợp)</option>
                <option value="Java Backend">☕ Java Backend & JVM</option>
                <option value="Spring Boot">🍃 Spring Boot & Spring Ecosystem</option>
                <option value="Database">🗄️ Database & JPA / Hibernate</option>
                <option value="Network">🌐 Network & Web Protocols</option>
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
                Trình độ mục tiêu:
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                  background: 'var(--ifm-background-color, #f8fafc)',
                  color: 'var(--ifm-color-content, #0f172a)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">🎯 Tất Cả Trình Độ</option>
                <option value="Intern">🌱 Intern (Thực tập sinh)</option>
                <option value="Fresher">⚡ Fresher (Mới tốt nghiệp / Dưới 1 năm)</option>
                <option value="Junior">🔥 Junior (1 - 2 năm kinh nghiệm)</option>
              </select>
            </div>

            {/* Question Count (Only in Config Mode) */}
            {activeSetupTab === 'config' ? (
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
                  Số lượng câu hỏi:
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                    background: 'var(--ifm-background-color, #f8fafc)',
                    color: 'var(--ifm-color-content, #0f172a)',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value={3}>3 câu (Khởi động nhanh - ~5 phút)</option>
                  <option value={5}>5 câu (Buổi phỏng vấn tiêu chuẩn - ~10 phút)</option>
                  <option value={10}>10 câu (Phỏng vấn chuyên sâu - ~20 phút)</option>
                  <option value={15}>15 câu (Thử thách sinh tồn - ~30 phút)</option>
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
                  Tìm kiếm từ khóa câu hỏi / dàn ý:
                </label>
                <input
                  type="text"
                  placeholder="Nhập từ khóa (vd: HashMap, Pass-by-Value, Index...)"
                  value={bankSearchKeyword}
                  onChange={(e) => setBankSearchKeyword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                    background: 'var(--ifm-background-color, #f8fafc)',
                    color: 'var(--ifm-color-content, #0f172a)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* TAB 1: CONFIG START BUTTON */}
          {activeSetupTab === 'config' && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleStartSession}
                style={{
                  padding: '14px 40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                🚀 Bắt Đầu Buổi Phỏng Vấn Ngay
              </button>
            </div>
          )}

          {/* TAB 2: QUESTION BANK & FULL OUTLINES EXPLORER */}
          {activeSetupTab === 'bank' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content, #0f172a)' }}>
                  Hiển thị {filteredBankQuestions.length} câu hỏi phù hợp:
                </span>
                <span style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                  💡 Bấm vào câu hỏi để xem toàn bộ <strong>dàn ý</strong> và lời giải chuẩn 10 điểm
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '540px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredBankQuestions.map((q) => {
                  const isExpanded = expandedBankQuestionId === q.id;
                  return (
                    <div
                      key={q.id}
                      style={{
                        borderRadius: '10px',
                        border: `1.5px solid ${isExpanded ? '#0ea5e9' : 'var(--ifm-color-emphasis-300, #e2e8f0)'}`,
                        background: isExpanded ? 'var(--ifm-color-emphasis-100, #f0f9ff)' : 'var(--ifm-background-color, #f8fafc)',
                        padding: '16px 20px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        onClick={() => setExpandedBankQuestionId(isExpanded ? null : q.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          cursor: 'pointer',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: q.topic === 'Java Backend' ? '#dcfce7' : q.topic === 'Spring Boot' ? '#fef3c7' : q.topic === 'Database' ? '#fee2e2' : '#e0e7ff',
                              color: q.topic === 'Java Backend' ? '#166534' : q.topic === 'Spring Boot' ? '#92400e' : q.topic === 'Database' ? '#991b1b' : '#3730a3'
                            }}>
                              {q.topic}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#475569'
                            }}>
                              {q.level}
                            </span>
                            <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
                              ({q.coreKeyPoints.length} luận điểm trọng tâm)
                            </span>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 750, color: 'var(--ifm-color-content, #0f172a)', lineHeight: 1.4 }}>
                            {q.question}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSingleQuestion(q);
                            }}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: '#0ea5e9',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Luyện câu này ➔
                          </button>
                          <span style={{ fontSize: '14px', color: '#0ea5e9', fontWeight: 800 }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* EXPANDED CONTENT: DÀN Ý + ĐÁP ÁN MẪU + CẠM BẪY */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--ifm-color-emphasis-300, #cbd5e1)' }}>
                          {/* Context */}
                          <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--ifm-color-content-secondary, #64748b)', marginBottom: '14px' }}>
                            📌 <strong>Bối cảnh phỏng vấn:</strong> {q.contextPrompt}
                          </div>

                          {/* DÀN Ý CÁC LUẬN ĐIỂM TRỌNG TÂM */}
                          <div style={{
                            background: 'var(--ifm-card-background-color, #ffffff)',
                            border: '1.5px solid #38bdf8',
                            borderRadius: '10px',
                            padding: '14px 18px',
                            marginBottom: '14px'
                          }}>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📋 DÀN Ý CÁC LUẬN ĐIỂM BẮT BUỘC ĐỂ ĐẠT ĐIỂM CAO ({q.coreKeyPoints.length} Ý):</span>
                            </div>
                            <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                              {q.coreKeyPoints.map((pt, pIdx) => (
                                <li key={pt.id || pIdx} style={{ marginBottom: '8px', fontSize: '13.5px', lineHeight: 1.5 }}>
                                  <strong>Ý {pIdx + 1}:</strong> {pt.pointText}
                                  <span style={{
                                    marginLeft: '8px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    fontSize: '11px',
                                    fontWeight: 700
                                  }}>
                                    Trọng số: {pt.weight}%
                                  </span>
                                  {pt.keywords.length > 0 && (
                                    <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary, #64748b)', marginTop: '2px' }}>
                                      Từ khóa gợi ý: {pt.keywords.slice(0, 5).join(', ')}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Ideal Answer */}
                          <div style={{
                            background: 'var(--ifm-card-background-color, #ffffff)',
                            border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)',
                            borderRadius: '10px',
                            padding: '14px 18px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#166534', marginBottom: '6px' }}>
                              🏆 Câu Trả Lời Mẫu Chuẩn Senior (10/10 Điểm):
                            </div>
                            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--ifm-color-content, #1e293b)', whiteSpace: 'pre-line' }}>
                              {q.idealAnswer}
                            </p>
                          </div>

                          {/* Trap & Scoring */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '12.5px' }}>
                              <strong>⚠️ Cạm bẫy:</strong> {q.trapWarning}
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12.5px' }}>
                              <strong>🎯 Tiêu chí chấm điểm:</strong> {q.scoringCriteria}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. INTERVIEWING PHASE */}
      {/* ======================================================== */}
      {phase === 'INTERVIEWING' && currentQuestion && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
            paddingBottom: '14px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                background: '#0ea5e9',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '13px'
              }}>
                Câu {currentIndex + 1} / {sessionQuestions.length}
              </span>
              <span style={{
                background: currentQuestion.topic === 'Java Backend' ? '#dcfce7' : currentQuestion.topic === 'Spring Boot' ? '#fef3c7' : currentQuestion.topic === 'Database' ? '#fee2e2' : '#e0e7ff',
                color: currentQuestion.topic === 'Java Backend' ? '#166534' : currentQuestion.topic === 'Spring Boot' ? '#92400e' : currentQuestion.topic === 'Database' ? '#991b1b' : '#3730a3',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                border: '1px solid currentColor'
              }}>
                {currentQuestion.topic}
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                {currentQuestion.level}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'monospace',
              fontSize: '15px',
              fontWeight: 700,
              color: timerSeconds > 180 ? '#ef4444' : 'var(--ifm-color-content, #0f172a)'
            }}>
              <span>⏱️</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Question Text */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ifm-color-content, #0f172a)', lineHeight: 1.4, margin: '0 0 10px 0' }}>
              {currentQuestion.question}
            </h2>
            <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #64748b)', fontStyle: 'italic' }}>
              💡 Bối cảnh: {currentQuestion.contextPrompt}
            </div>
          </div>

          {/* HINT DROPDOWN TOGGLE (XEM DÀN Ý GỢI Ý) */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              style={{
                background: showHint ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                border: '1.5px solid #0284c7',
                borderRadius: '8px',
                color: '#0284c7',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{showHint ? '🔼 Ẩn dàn ý gợi ý' : '💡 Xem dàn ý gợi ý (Bấm để xem các ý trọng tâm mong đợi)'}</span>
            </button>

            {showHint && (
              <div style={{
                marginTop: '12px',
                padding: '16px 20px',
                background: 'var(--ifm-color-emphasis-100, #f0f9ff)',
                border: '1.5px solid #38bdf8',
                borderRadius: '10px',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '14px',
                lineHeight: 1.6
              }}>
                <div style={{ fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯 Dàn ý các luận điểm trọng tâm nhà tuyển dụng mong đợi ({currentQuestion.coreKeyPoints.length} ý):</span>
                </div>
                <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                  {currentQuestion.coreKeyPoints.map((pt, i) => (
                    <li key={pt.id || i} style={{ marginBottom: '8px' }}>
                      <strong>Ý {i + 1}:</strong> {pt.pointText}
                      <span style={{
                        fontSize: '11.5px',
                        color: '#0369a1',
                        background: '#e0f2fe',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        marginLeft: '8px',
                        fontWeight: 700
                      }}>
                        Chiếm {pt.weight}% điểm
                      </span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary, #64748b)', fontStyle: 'italic', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                  ⚠️ Hãy diễn đạt các ý trên bằng văn phong tự nhiên của bạn, kết hợp định nghĩa, cơ chế và ví dụ thực tế.
                </div>
              </div>
            )}
          </div>

          {/* User Answer Textarea */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
              Câu trả lời của bạn:
            </label>
            <textarea
              rows={8}
              value={currentUserAnswer}
              onChange={(e) => {
                setCurrentUserAnswer(e.target.value);
                if (submitError) setSubmitError(null);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              placeholder="Nhập câu trả lời chi tiết của bạn tại đây... (Mẹo: Có thể nhấn Ctrl + Enter hoặc Cmd + Enter để nộp bài nhanh)..."
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: `1.5px solid ${submitError ? '#ef4444' : 'var(--ifm-color-emphasis-300, #98A2B3)'}`,
                background: 'var(--ifm-background-color, #ffffff)',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '15px',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            {submitError && (
              <div style={{
                marginTop: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{submitError}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary, #64748b)', marginTop: '6px' }}>
              <span>Độ dài: {currentUserAnswer.trim().split(/\s+/).filter(Boolean).length} từ</span>
              <span>Khuyến nghị tối thiểu: 30 - 80 từ • Nhấn <strong>Ctrl + Enter</strong> để nộp</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={handleSkipQuestion}
              disabled={isEvaluating}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
                color: 'var(--ifm-color-content-secondary, #64748b)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isEvaluating ? 'not-allowed' : 'pointer'
              }}
            >
              ⏭️ Bỏ qua câu này
            </button>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isEvaluating}
              style={{
                padding: '12px 30px',
                borderRadius: '8px',
                background: isEvaluating
                  ? '#64748b'
                  : currentUserAnswer.trim().length > 0
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: isEvaluating ? 'wait' : 'pointer',
                boxShadow: isEvaluating ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {isEvaluating ? (
                <>
                  <span>⏳</span>
                  <span>AI Đang Phân Tích & Chấm Điểm...</span>
                </>
              ) : (
                <span>✅ Nộp Câu Trả Lời & Chấm Điểm</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. EVALUATED RESULT PHASE */}
      {/* ======================================================== */}
      {phase === 'EVALUATED' && currentEvaluation && currentQuestion && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Result Score Banner (Black background in Dark Theme with tier styling) */}
          {(() => {
            const scoreTier = currentEvaluation.score >= 80 ? 'score-high' : currentEvaluation.score >= 60 ? 'score-medium' : 'score-low';
            return (
              <div className={`mock-eval-banner ${scoreTier}`}>
                <div style={{ flex: '1 1 300px' }}>
                  <div
                    className={`mock-eval-banner-tag ${scoreTier}`}
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    KẾT QUẢ ĐÁNH GIÁ CÂU HỎI
                  </div>
                  <div
                    className={`mock-eval-banner-score ${scoreTier}`}
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      marginTop: '4px'
                    }}
                  >
                    {currentEvaluation.score} / 100 ĐIỂM • {Math.round((currentEvaluation.matchedPoints.length / currentQuestion.coreKeyPoints.length) * 100)}% ĐỘ KHỚP Ý
                  </div>
                  <div className="mock-eval-banner-feedback">
                    {currentEvaluation.feedbackSummary}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '15px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {currentIndex + 1 < sessionQuestions.length ? 'Tiếp Tục Câu Tiếp Theo ➔' : 'Xem Báo Cáo Tổng Kết ➔'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Matched vs Missing Key Points Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* Matched */}
            <div className="mock-eval-card-matched" style={{
              padding: '18px',
              borderRadius: '10px',
              background: 'var(--ifm-background-color, #f8fafc)',
              border: '1px solid #cbd5e1'
            }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span>✅ Các Ý Chính Bạn Đã Trả Lời Tốt ({currentEvaluation.matchedPoints.length}):</span>
              </div>
              {currentEvaluation.matchedPoints.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: 'var(--ifm-color-content, #334155)', lineHeight: 1.6 }}>
                  {currentEvaluation.matchedPoints.map((item, i) => (
                    <li key={item.point.id || i} style={{ marginBottom: '6px' }}>
                      <strong>{item.point.pointText}</strong>
                      {item.matchedKeywords.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                          Từ khóa khớp: {item.matchedKeywords.join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Chưa phát hiện được ý chính nào khớp với yêu cầu câu hỏi.
                </div>
              )}
            </div>

            {/* Missing */}
            <div className="mock-eval-card-missing" style={{
              padding: '18px',
              borderRadius: '10px',
              background: 'var(--ifm-background-color, #f8fafc)',
              border: '1px solid #cbd5e1'
            }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span>❌ Các Ý Quan Trọng Còn Bị Thiếu Hoặc Chưa Rõ ({currentEvaluation.missingPoints.length}):</span>
              </div>
              {currentEvaluation.missingPoints.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: 'var(--ifm-color-content, #334155)', lineHeight: 1.6 }}>
                  {currentEvaluation.missingPoints.map((item, i) => (
                    <li key={item.point.id || i} style={{ marginBottom: '6px' }}>
                      <strong>{item.point.pointText}</strong>
                      <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>
                        (Cần bổ sung ý này để ghi thêm {item.point.weight}% điểm)
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                  Tuyệt vời! Bạn không bỏ sót bất kỳ ý cốt lõi nào của câu hỏi này.
                </div>
              )}
            </div>
          </div>

          {/* TOGGLE FULL OUTLINE IN EVALUATION */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowFullOutlineInEval(!showFullOutlineInEval)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0284c7',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0
              }}
            >
              <span>{showFullOutlineInEval ? '🔼 Thu gọn dàn ý chi tiết' : '📖 Xem toàn bộ dàn ý cấu trúc câu hỏi'}</span>
            </button>
            {showFullOutlineInEval && (
              <div className="mock-eval-card-outline" style={{
                marginTop: '10px',
                padding: '16px 20px',
                background: 'var(--ifm-color-emphasis-100, #f0f9ff)',
                border: '1.5px solid #38bdf8',
                borderRadius: '10px',
                color: 'var(--ifm-color-content, #0f172a)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0284c7', marginBottom: '8px' }}>
                  🎯 Dàn Ý Chuẩn Của Câu Hỏi:
                </div>
                <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                  {currentQuestion.coreKeyPoints.map((pt, i) => (
                    <li key={pt.id || i} style={{ marginBottom: '6px', fontSize: '13.5px' }}>
                      <strong>Ý {i + 1} ({pt.weight}%):</strong> {pt.pointText}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Model Answer (Câu trả lời mẫu 10 điểm) */}
          <div className="mock-eval-card-model-ans" style={{
            background: 'var(--ifm-background-color, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--ifm-color-content, #0f172a)' }}>
                Câu Trả Lời Mẫu Chuẩn Senior (10/10 Điểm):
              </h3>
            </div>
            <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--ifm-color-content, #1e293b)', whiteSpace: 'pre-line', margin: 0 }}>
              {currentQuestion.idealAnswer}
            </p>
          </div>

          {/* Scoring Criteria & Trap Warning */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="mock-eval-card-criteria" style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534'
            }}>
              <div style={{ fontWeight: 800, fontSize: '13.5px', marginBottom: '6px' }}>
                🎯 Tiêu Chí Chấm Điểm Tuyệt Đối:
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#14532d' }}>
                {currentQuestion.scoringCriteria}
              </p>
            </div>

            <div className="mock-eval-card-trap" style={{
              padding: '16px',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e'
            }}>
              <div style={{ fontWeight: 800, fontSize: '13.5px', marginBottom: '6px' }}>
                ⚠️ Cạm Bẫy Phỏng Vấn Thường Gặp:
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#78350f' }}>
                {currentQuestion.trapWarning}
              </p>
            </div>
          </div>

          {/* Your Submitted Answer Review */}
          <div className="mock-eval-card-user-ans" style={{
            padding: '16px 20px',
            borderRadius: '10px',
            background: 'var(--ifm-background-color, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content-secondary, #64748b)', marginBottom: '6px' }}>
              CÂU TRẢ LỜI BẠN ĐÃ NHẬP:
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ifm-color-content, #0f172a)', fontStyle: 'italic', lineHeight: 1.6 }}>
              "{currentUserAnswer || '(Để trống)'}"
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUMMARY PHASE */}
      {/* ======================================================== */}
      {phase === 'SUMMARY' && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '8px 0', color: 'var(--ifm-color-content, #0f172a)' }}>
              Báo Cáo Tổng Kết Buổi Phỏng Vấn
            </h2>
            <p style={{ color: 'var(--ifm-color-content-secondary, #64748b)', fontSize: '15px' }}>
              Bạn đã hoàn thành <strong>{answersHistory.length} câu hỏi</strong> phỏng vấn mô phỏng.
            </p>
          </div>

          {/* Big Score Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '28px',
            borderRadius: '14px',
            background: 'var(--ifm-background-color, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content-secondary, #64748b)' }}>ĐIỂM TRUNG BÌNH</div>
              <div style={{
                fontSize: '3.2rem',
                fontWeight: 900,
                color: summaryStats.avgScore >= 80 ? '#10b981' : summaryStats.avgScore >= 60 ? '#3b82f6' : '#f59e0b'
              }}>
                {summaryStats.avgScore}<span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>/100</span>
              </div>
            </div>

            <div style={{ maxWidth: '420px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>
                {summaryStats.avgScore >= 85
                  ? '🌟 Sẵn Sàng Pass Vòng Phỏng Vấn Doanh Nghiệp!'
                  : summaryStats.avgScore >= 65
                  ? '👍 Đạt Yêu Cầu Entry-Level • Cần Rèn Thêm Một Số Cạm Bẫy'
                  : '📚 Cần Luyện Thêm Kiến Thức Nền Tảng & Bản Chất'}
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #64748b)', lineHeight: 1.5 }}>
                {summaryStats.avgScore >= 80
                  ? 'Bạn có khả năng diễn đạt logic, bao quát đầy đủ đại ý và sử dụng thuật ngữ kỹ thuật rất tốt. Hãy tự tin apply các công ty Product/Outsourcing lớn.'
                  : 'Bạn đã nắm được các khái niệm cơ bản nhưng còn thiếu các chi tiết under-the-hood. Hãy đối chiếu dàn ý và đọc lại các chủ đề còn yếu trong Career Hub trước khi phỏng vấn.'}
              </p>
            </div>
          </div>

          {/* Topic Breakdown */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
            📊 Phân Tích Điểm Theo Chủ Đề:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {Object.entries(summaryStats.byTopic).map(([topic, score]) => (
              <div key={topic} style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--ifm-background-color, #f8fafc)',
                border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content-secondary, #64748b)', marginBottom: '4px' }}>
                  {topic}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : '#f59e0b' }}>
                  {score} điểm
                </div>
              </div>
            ))}
          </div>

          {/* Question By Question Review with DÀN Ý */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
            📝 Chi Tiết Từng Câu Hỏi & Dàn Ý Cần Cải Thiện:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
            {answersHistory.map((item, idx) => {
              const isItemExpanded = expandedHistoryIndex === idx;
              return (
                <div key={idx} style={{
                  padding: '18px 20px',
                  borderRadius: '10px',
                  background: 'var(--ifm-background-color, #f8fafc)',
                  border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)'
                }}>
                  <div
                    onClick={() => setExpandedHistoryIndex(isItemExpanded ? null : idx)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#0ea5e9' }}>Câu {idx + 1}</span>
                        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>• {item.question.topic}</span>
                        <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>• Bấm xem dàn ý</span>
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 700 }}>
                        {item.question.question}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        background: item.evaluation.score >= 80 ? '#dcfce7' : item.evaluation.score >= 60 ? '#e0f2fe' : '#fef3c7',
                        color: item.evaluation.score >= 80 ? '#15803d' : item.evaluation.score >= 60 ? '#0369a1' : '#92400e'
                      }}>
                        {item.evaluation.score} điểm
                      </span>
                      <span style={{ color: '#0ea5e9', fontWeight: 800 }}>{isItemExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isItemExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--ifm-color-emphasis-300, #cbd5e1)' }}>
                      <div style={{
                        background: 'var(--ifm-card-background-color, #ffffff)',
                        border: '1.5px solid #38bdf8',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        marginBottom: '14px'
                      }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0284c7', marginBottom: '8px' }}>
                          📋 Dàn Ý & Luận Điểm Đánh Giá:
                        </div>
                        <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                          {item.question.coreKeyPoints.map((pt, pIdx) => {
                            const isMatched = item.evaluation.matchedPoints.some((m) => m.point.id === pt.id);
                            return (
                              <li key={pt.id || pIdx} style={{ marginBottom: '6px', fontSize: '13.5px' }}>
                                <span style={{ color: isMatched ? '#166534' : '#dc2626', fontWeight: 700 }}>
                                  {isMatched ? '✅' : '❌'} Ý {pIdx + 1}:
                                </span>{' '}
                                {pt.pointText}{' '}
                                <span style={{ fontSize: '11px', color: '#64748b' }}>({pt.weight}%)</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content, #1e293b)', lineHeight: 1.6 }}>
                        <strong>Câu trả lời của bạn:</strong> "{item.userAnswer}"
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Restart / Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleStartSession}
              style={{
                padding: '12px 30px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
              }}
            >
              🔄 Luyện Tập Buổi Mới (Đề Ngẫu Nhiên Khác)
            </button>

            <button
              type="button"
              onClick={() => {
                setPhase('SETUP');
                setActiveSetupTab('bank');
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1.5px solid #0ea5e9',
                color: '#0ea5e9',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📚 Xem Toàn Bộ Dàn Ý Ngân Hàng Câu Hỏi
            </button>

            {onSwitchTab ? (
              <button
                type="button"
                onClick={() => onSwitchTab('lessons')}
                style={{
                  padding: '12px 26px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                  color: 'var(--ifm-color-content, #0f172a)',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📘 Khám Phá Kiến Thức Career Hub
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
