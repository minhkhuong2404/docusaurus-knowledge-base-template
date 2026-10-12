import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MOCK_INTERVIEW_QUESTIONS,
  MockInterviewQuestion
} from '../../data/mockInterviewQuestionsData';
import {
  MASKED_COMPANIES,
  MaskedCompany,
  InterviewerPersona,
  ENTRY_LEVEL_PROFILES,
  LevelProfile,
  CandidateQAOption,
  getCompanyById,
  getRandomCompany,
  MOCK_INTERVIEW_DISCLAIMER
} from '../../data/mockInterviewCompaniesData';
import {
  evaluateMockAnswer,
  EvaluationResult
} from '../../utils/mockInterviewEvaluator';

type InterviewPhase = 'SETUP' | 'ICEBREAKER' | 'INTERVIEWING' | 'EVALUATED' | 'CANDIDATE_QA' | 'SUMMARY';

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

  // Candidate & Company Configuration State
  const [candidateName, setCandidateName] = useState<string>('Ứng Viên');
  const [selectedLevel, setSelectedLevel] = useState<'Intern' | 'Fresher' | 'Junior'>('Fresher');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('company-g');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [activeSetupTab, setActiveSetupTab] = useState<'interview' | 'bank'>('interview');
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

  // Icebreaker & Conversational Dialog State
  const [candidateIntroText, setCandidateIntroText] = useState<string>('');
  const [icebreakerAcknowledged, setIcebreakerAcknowledged] = useState<boolean>(false);

  // Candidate Q&A State (Reverse Interview)
  const [askedQuestionsHistory, setAskedQuestionsHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [customCandidateQuestion, setCustomCandidateQuestion] = useState<string>('');

  // Results History State
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [answersHistory, setAnswersHistory] = useState<AnswerRecord[]>([]);
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);

  // Derived current company, interviewer and level profile
  const currentCompany: MaskedCompany = useMemo(() => {
    return getCompanyById(selectedCompanyId);
  }, [selectedCompanyId]);

  const currentInterviewer: InterviewerPersona = useMemo(() => {
    return currentCompany.interviewers[0] || MASKED_COMPANIES[0].interviewers[0];
  }, [currentCompany]);

  const currentLevelProfile: LevelProfile = useMemo(() => {
    return ENTRY_LEVEL_PROFILES[selectedLevel];
  }, [selectedLevel]);

  // Keep question count synced with level recommendations when user changes level in SETUP
  useEffect(() => {
    if (phase === 'SETUP') {
      setQuestionCount(currentLevelProfile.defaultQuestionCount);
    }
  }, [selectedLevel, currentLevelProfile, phase]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (phase === 'INTERVIEWING' || phase === 'ICEBREAKER') {
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

  // Current Technical Question
  const currentQuestion: MockInterviewQuestion | undefined = sessionQuestions[currentIndex];

  // Start Full Realistic Session
  const handleStartSession = () => {
    let pool = [...MOCK_INTERVIEW_QUESTIONS];

    // Priority 1: Filter by target level
    let levelPool = pool.filter((q) => q.level === selectedLevel);
    if (levelPool.length < questionCount) {
      // If pool has fewer questions than requested count, fallback to all levels
      levelPool = pool;
    }

    // Priority 2: Filter by specific topic if user selected one
    if (selectedTopic !== 'ALL') {
      levelPool = levelPool.filter((q) => q.topic === selectedTopic);
    } else {
      // If topic is ALL, prioritize topics relevant to target company
      const companyPreferred = levelPool.filter((q) => currentCompany.preferredTopics.includes(q.topic));
      if (companyPreferred.length >= 2) {
        // Shuffle preferred and combine with others for well-rounded technical round
        const others = levelPool.filter((q) => !currentCompany.preferredTopics.includes(q.topic));
        levelPool = [
          ...companyPreferred.sort(() => 0.5 - Math.random()),
          ...others.sort(() => 0.5 - Math.random())
        ];
      }
    }

    // Shuffle and pick desired count
    const shuffled = levelPool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (selected.length === 0) {
      alert('Không tìm thấy câu hỏi phù hợp với cấu hình đã chọn! Vui lòng chọn lại.');
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
    setIcebreakerAcknowledged(false);
    setAskedQuestionsHistory([]);
    setCandidateIntroText('');

    // Pre-populate icebreaker template for candidate
    if (selectedLevel === 'Intern') {
      setCandidateIntroText(`Em là ${candidateName.trim() || 'Ứng viên'}, sinh viên năm cuối chuyên ngành CNTT. Em có nền tảng vững về Java Core, OOP và cơ sở dữ liệu, rất mong muốn được học hỏi và thực chiến tại ${currentCompany.maskedName}.`);
    } else if (selectedLevel === 'Fresher') {
      setCandidateIntroText(`Chào anh/chị, em là ${candidateName.trim() || 'Ứng viên'}. Em vừa tốt nghiệp và đã tự tay phát triển các dự án backend Spring Boot REST API, nắm vững về Database indexing và luồng xử lý web.`);
    } else {
      setCandidateIntroText(`Chào anh/chị, em là ${candidateName.trim() || 'Ứng viên'}. Em đã có hơn 1 năm kinh nghiệm phát triển backend Java/Spring Boot, từng xử lý các bài toán về Concurrency, tối ưu truy vấn SQL và xử lý sự cố hệ thống.`);
    }

    setPhase('ICEBREAKER');
    if (typeof window !== 'undefined') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Start Single Question Practice directly from Question Bank
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
    if (typeof window !== 'undefined') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Proceed from Icebreaker into Technical Round
  const handleProceedToTechnicalRound = () => {
    setIcebreakerAcknowledged(true);
    setTimeout(() => {
      setPhase('INTERVIEWING');
      setTimerSeconds(0);
      if (typeof window !== 'undefined') {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 600);
  };

  // Submit Technical Answer for Evaluation
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
    }, 350);
  };

  // Move to Next Question or Candidate Q&A
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
      // Finished all technical questions -> Move to Candidate Q&A stage
      setPhase('CANDIDATE_QA');
    }
    if (typeof window !== 'undefined') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      setPhase('CANDIDATE_QA');
    }
    if (typeof window !== 'undefined') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Candidate asks a question during Q&A stage
  const handleAskInterviewer = (qa: CandidateQAOption) => {
    if (askedQuestionsHistory.some((item) => item.question === qa.question)) return;
    setAskedQuestionsHistory((prev) => [
      ...prev,
      { question: qa.question, answer: qa.interviewerAnswer }
    ]);
  };

  const handleAskCustomQuestion = () => {
    if (!customCandidateQuestion.trim()) return;
    const customQ = customCandidateQuestion.trim();
    const answer = `Cảm ơn câu hỏi rất hay của ${candidateName.trim() || 'bạn'}! Tại ${currentCompany.maskedName}, các kỹ sư ${selectedLevel} luôn được trao cơ hội học hỏi và đóng góp trực tiếp vào hệ thống lớn. Tinh thần chủ động đặt câu hỏi và tìm hiểu bản chất chính là tố chất mà hội đồng phỏng vấn đánh giá rất cao.`;
    setAskedQuestionsHistory((prev) => [
      ...prev,
      { question: customQ, answer }
    ]);
    setCustomCandidateQuestion('');
  };

  // Calculate Overall Summary Stats & Final Hiring Decision
  const summaryStats = useMemo(() => {
    if (answersHistory.length === 0) {
      return {
        avgScore: 0,
        byTopic: {},
        hiringDecision: 'NO_HIRE',
        decisionLabel: 'Cần Ôn Luyện Thêm',
        decisionBadgeColor: '#ef4444',
        passRate: 0
      };
    }

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

    let hiringDecision = 'NO_HIRE';
    let decisionLabel = '📚 Chưa Đạt Tiêu Chuẩn Vòng Này • Cần Củng Cố Nền Tảng';
    let decisionBadgeColor = '#ef4444';

    if (avg >= currentLevelProfile.strongHireThresholdScore) {
      hiringDecision = 'STRONG_HIRE';
      decisionLabel = '🌟 STRONG HIRE • Vượt Trội Chuẩn Tuyển Dụng';
      decisionBadgeColor = '#10b981';
    } else if (avg >= currentLevelProfile.passThresholdScore) {
      hiringDecision = 'HIRE';
      decisionLabel = '✅ HIRE • Đạt Tiêu Chuẩn Vòng Phỏng Vấn';
      decisionBadgeColor = '#0ea5e9';
    } else if (avg >= currentLevelProfile.passThresholdScore - 12) {
      hiringDecision = 'LEANING_HIRE';
      decisionLabel = '⚖️ LEANING HIRE • Có Tiềm Năng, Cần Rèn Luyện Thêm';
      decisionBadgeColor = '#f59e0b';
    }

    return {
      avgScore: avg,
      byTopic: topicAvg,
      hiringDecision,
      decisionLabel,
      decisionBadgeColor,
      passRate: Math.round((answersHistory.filter((r) => r.evaluation.score >= currentLevelProfile.passThresholdScore).length / answersHistory.length) * 100)
    };
  }, [answersHistory, currentLevelProfile]);

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
      {/* 1. SETUP PHASE: COMPANY & LEVEL SELECTION                */}
      {/* ======================================================== */}
      {phase === 'SETUP' && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '960px',
          margin: '0 auto'
        }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🎙️</span>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--ifm-color-content, #0f172a)' }}>
                  Phòng Phỏng Vấn Thử & Mô Phỏng Big Tech
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                  Trải nghiệm buổi phỏng vấn như thật với Interiewer đến từ các tập đoàn lớn (G***, A***, N***, M***, S***...)
                </div>
              </div>
            </div>

            {/* Mode Switch Tabs */}
            <div style={{ display: 'inline-flex', background: 'var(--ifm-color-emphasis-100, #f1f5f9)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveSetupTab('interview')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSetupTab === 'interview' ? '#0ea5e9' : 'transparent',
                  color: activeSetupTab === 'interview' ? '#ffffff' : 'var(--ifm-color-content-secondary, #64748b)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🏢 Mô Phỏng Phỏng Vấn
              </button>
              <button
                type="button"
                onClick={() => setActiveSetupTab('bank')}
                style={{
                  padding: '7px 16px',
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
                📚 Ngân Hàng Câu Hỏi ({MOCK_INTERVIEW_QUESTIONS.length} Câu)
              </button>
            </div>
          </div>

          {activeSetupTab === 'interview' ? (
            <div>
              <p style={{ color: 'var(--ifm-color-content-secondary, #475569)', fontSize: '14.5px', marginBottom: '16px', lineHeight: 1.6 }}>
                Hệ thống mô phỏng một buổi phỏng vấn chuyên nghiệp gồm 4 chặng: <strong>Khởi động & Chào hỏi ➔ Vòng Kỹ thuật chuyên sâu ➔ Ứng viên đặt câu hỏi (Q&A) ➔ Quyết định tuyển dụng & Bảng điểm Bar Raiser</strong>.
              </p>

              {/* Educational Disclaimer Banner */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: '12.5px', color: 'var(--ifm-color-content, #0f172a)', lineHeight: 1.5 }}>
                  <strong>Miễn trừ trách nhiệm:</strong> {MOCK_INTERVIEW_DISCLAIMER.shortText}
                </span>
              </div>

              {/* CANDIDATE NAME & LEVEL SELECTOR */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
                    Tên / Biệt danh ứng viên:
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Nhập tên của bạn (vd: Minh Khương)"
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
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
                    Trình độ phỏng vấn mục tiêu (Entry-Level):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {(['Intern', 'Fresher', 'Junior'] as const).map((lvl) => {
                      const isSelected = selectedLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSelectedLevel(lvl)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #0ea5e9' : '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
                            background: isSelected ? 'rgba(14, 165, 233, 0.12)' : 'var(--ifm-background-color, #f8fafc)',
                            color: isSelected ? '#0284c7' : 'var(--ifm-color-content, #334155)',
                            fontWeight: 750,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'center'
                          }}
                        >
                          {lvl === 'Intern' ? '🌱 Intern' : lvl === 'Fresher' ? '🚀 Fresher' : '⚡ Junior'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LEVEL EXPECTATION BRIEFING BOX */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'var(--ifm-color-emphasis-100, #f0f9ff)',
                border: '1px solid #bae6fd',
                marginBottom: '22px'
              }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0369a1', marginBottom: '6px' }}>
                  🎯 Tiêu Chuẩn Đánh Giá Cho Vị Trí: {currentLevelProfile.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #334155)', marginBottom: '8px' }}>
                  {currentLevelProfile.targetAudience}
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content, #334155)', lineHeight: 1.5 }}>
                  {currentLevelProfile.coreExpectations.slice(0, 3).map((exp, i) => (
                    <li key={i}>{exp}</li>
                  ))}
                </ul>
              </div>

              {/* COMPANY TRACK SELECTION (MASKED COMPANIES A***, N***, G***) */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ifm-color-content, #0f172a)' }}>
                    🏢 Chọn Công Ty Phỏng Vấn (Masked Big Tech):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const random = getRandomCompany();
                      setSelectedCompanyId(random.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🎲 Bốc thăm ngẫu nhiên công ty
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {MASKED_COMPANIES.map((company) => {
                    const isSelected = selectedCompanyId === company.id;
                    return (
                      <div
                        key={company.id}
                        onClick={() => setSelectedCompanyId(company.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${company.badgeColor}` : '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
                          background: isSelected ? 'rgba(14, 165, 233, 0.08)' : 'var(--ifm-background-color, #f8fafc)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 850,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: company.badgeColor,
                            color: '#ffffff'
                          }}>
                            {company.maskedName}
                          </span>
                          <span style={{ fontSize: '18px' }}>
                            {company.interviewers[0]?.avatarIcon || '👨‍💻'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ifm-color-content, #0f172a)', lineHeight: 1.3 }}>
                          {company.realWorldHint}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                          {company.tagline}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERVIEWER PROFILE BRIEFING CARD */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '12px',
                background: 'var(--ifm-background-color, #f8fafc)',
                border: '1.5px dashed var(--ifm-color-emphasis-300, #cbd5e1)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ fontSize: '40px', flexShrink: 0 }}>
                  {currentInterviewer.avatarIcon}
                </div>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ifm-color-content, #0f172a)' }}>
                      {currentInterviewer.name}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: currentCompany.badgeColor,
                      color: '#ffffff'
                    }}>
                      {currentInterviewer.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #475569)', lineHeight: 1.5, marginBottom: '6px' }}>
                    {currentInterviewer.bio}
                  </div>
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#0284c7' }}>
                    💡 Văn hóa phỏng vấn: {currentCompany.cultureAndBarRaiserTip}
                  </div>
                </div>
              </div>

              {/* ADVANCED QUESTION COUNT & TOPIC CONTROLS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '26px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: 'var(--ifm-color-content, #0f172a)' }}>
                    Số lượng câu hỏi kỹ thuật:
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                      background: 'var(--ifm-background-color, #f8fafc)',
                      color: 'var(--ifm-color-content, #0f172a)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value={3}>3 câu (Khởi động nhanh - ~15 phút)</option>
                    <option value={currentLevelProfile.defaultQuestionCount}>
                      {currentLevelProfile.defaultQuestionCount} câu (Khuyên dùng cho {selectedLevel} - ~{currentLevelProfile.expectedDurationMinutes} phút)
                    </option>
                    <option value={8}>8 câu (Vòng chuyên sâu Big Tech - ~40 phút)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: 'var(--ifm-color-content, #0f172a)' }}>
                    Chủ đề trọng tâm:
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                      background: 'var(--ifm-background-color, #f8fafc)',
                      color: 'var(--ifm-color-content, #0f172a)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="ALL">🌐 Toàn diện (Ưu tiên theo khẩu vị {currentCompany.maskedName})</option>
                    <option value="Java Backend">☕ Java Backend & JVM</option>
                    <option value="Spring Boot">🍃 Spring Boot Ecosystem</option>
                    <option value="Database">🗄️ Database & JPA / Hibernate</option>
                    <option value="Network">🌐 Network & Web Protocols</option>
                  </select>
                </div>
              </div>

              {/* LAUNCH BUTTON */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleStartSession}
                  style={{
                    padding: '14px 44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(14, 165, 233, 0.45)',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>🎙️</span>
                  <span>Vào Phòng Phỏng Vấn Với {currentCompany.maskedName} ({currentInterviewer.name}) ➔</span>
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: QUESTION BANK & FULL OUTLINES EXPLORER */
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ifm-color-content, #0f172a)' }}>
                  Tra cứu {filteredBankQuestions.length} câu hỏi theo dàn ý:
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo từ khóa (vd: HashMap, Pass-by-Value, Index...)"
                  value={bankSearchKeyword}
                  onChange={(e) => setBankSearchKeyword(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                    background: 'var(--ifm-background-color, #f8fafc)',
                    color: 'var(--ifm-color-content, #0f172a)',
                    fontSize: '13px',
                    outline: 'none',
                    width: '320px',
                    maxWidth: '100%'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '560px', overflowY: 'auto' }}>
                {filteredBankQuestions.map((q) => {
                  const isExpanded = expandedBankQuestionId === q.id;
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--ifm-background-color, #f8fafc)',
                        border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)'
                      }}
                    >
                      <div
                        onClick={() => setExpandedBankQuestionId(isExpanded ? null : q.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                              {q.topic}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                              {q.level}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 600 }}>
                              ({q.coreKeyPoints.length} luận điểm trọng tâm)
                            </span>
                          </div>
                          <div style={{ fontSize: '14.5px', fontWeight: 750, color: 'var(--ifm-color-content, #0f172a)' }}>
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
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#0ea5e9',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Luyện câu này ➔
                          </button>
                          <span style={{ fontSize: '13px', color: '#0ea5e9', fontWeight: 800 }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--ifm-color-emphasis-300, #cbd5e1)' }}>
                          <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: 'var(--ifm-color-content-secondary, #64748b)', marginBottom: '10px' }}>
                            📌 <strong>Bối cảnh:</strong> {q.contextPrompt}
                          </div>

                          <div style={{ background: 'var(--ifm-card-background-color, #ffffff)', border: '1.5px solid #38bdf8', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0284c7', marginBottom: '6px' }}>
                              📋 DÀN Ý CÁC LUẬN ĐIỂM BẮT BUỘC ({q.coreKeyPoints.length} Ý):
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                              {q.coreKeyPoints.map((pt, pIdx) => (
                                <li key={pt.id || pIdx} style={{ fontSize: '13px', marginBottom: '6px' }}>
                                  <strong>Ý {pIdx + 1}:</strong> {pt.pointText}{' '}
                                  <span style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px' }}>
                                    {pt.weight}%
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div style={{ background: 'var(--ifm-card-background-color, #ffffff)', border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: '#166534', marginBottom: '4px' }}>
                              🏆 Câu Trả Lời Mẫu Chuẩn Senior (10/10 Điểm):
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--ifm-color-content, #1e293b)', whiteSpace: 'pre-line' }}>
                              {q.idealAnswer}
                            </p>
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
      {/* 2. ICEBREAKER PHASE: VIRTUAL ROOM WELCOME & INTRO        */}
      {/* ======================================================== */}
      {phase === 'ICEBREAKER' && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Virtual Room Status Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em' }}>
                🔴 LIVE • PHÒNG PHỎNG VẤN TRỰC TUYẾN
              </span>
              <span style={{
                background: currentCompany.badgeColor,
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '12px'
              }}>
                {currentCompany.maskedName}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                Vị trí: <strong>{currentLevelProfile.title}</strong>
              </span>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
              ⏱️ {formattedTime}
            </div>
          </div>

          {/* Interviewer Persona Card */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--ifm-color-emphasis-100, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: currentCompany.badgeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              {currentInterviewer.avatarIcon}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: 850, color: 'var(--ifm-color-content, #0f172a)' }}>
                  {currentInterviewer.name}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: currentCompany.badgeColor }}>
                  ({currentInterviewer.role})
                </span>
              </div>

              {/* Spoken greeting bubble */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'var(--ifm-card-background-color, #ffffff)',
                border: '1.5px solid #38bdf8',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '14px',
                lineHeight: 1.6,
                position: 'relative'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  {currentInterviewer.welcomeGreeting}
                </p>
                <p style={{ margin: '0 0 10px 0', fontWeight: 650, color: '#0284c7' }}>
                  💬 "Để làm quen và giúp bạn thoải mái nhất, {candidateName.trim() || 'bạn'} hãy chia sẻ đôi nét về bản thân hoặc một dự án bạn tâm đắc nhất nhé!"
                </p>
              </div>
            </div>
          </div>

          {/* Candidate Intro Box */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 750, fontSize: '13.5px', marginBottom: '8px', color: 'var(--ifm-color-content, #0f172a)' }}>
              Phần giới thiệu của bạn (Candidate Icebreaker):
            </label>
            <textarea
              rows={4}
              value={candidateIntroText}
              onChange={(e) => setCandidateIntroText(e.target.value)}
              placeholder="Nhập phần giới thiệu bản thân hoặc dự án tâm đắc của bạn..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                background: 'var(--ifm-background-color, #f8fafc)',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '14px',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={handleProceedToTechnicalRound}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
                color: 'var(--ifm-color-content-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: 650,
                cursor: 'pointer'
              }}
            >
              ⏩ Bỏ qua phần khởi động & Vào thẳng kỹ thuật
            </button>

            <button
              type="button"
              onClick={handleProceedToTechnicalRound}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{icebreakerAcknowledged ? '⏳ Đang kết nối...' : '✅ Gửi Lời Chào & Bắt Đầu Phần Kỹ Thuật ➔'}</span>
            </button>
          </div>

          {/* Educational Disclaimer Footnote */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary, #64748b)', fontStyle: 'italic' }}>
            ℹ️ {MOCK_INTERVIEW_DISCLAIMER.shortText}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. INTERVIEWING PHASE: TECHNICAL QUESTIONS ROUND         */}
      {/* ======================================================== */}
      {phase === 'INTERVIEWING' && currentQuestion && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            borderBottom: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: currentCompany.badgeColor,
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 850,
                fontSize: '13px'
              }}>
                {currentCompany.maskedName}
              </span>

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
                fontSize: '12.5px',
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
                Level: {currentQuestion.level}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          </div>

          {/* Interviewer Persona Banner */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'var(--ifm-color-emphasis-100, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)'
          }}>
            <span style={{ fontSize: '26px' }}>{currentInterviewer.avatarIcon}</span>
            <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content, #334155)' }}>
              <strong>{currentInterviewer.name} ({currentCompany.maskedName}):</strong> "Ở {currentCompany.maskedName}, bọn mình rất coi trọng việc hiểu sâu bản chất kỹ thuật. Hãy cùng xem xét câu hỏi này nhé:"
            </div>
          </div>

          {/* Question Text */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ifm-color-content, #0f172a)', lineHeight: 1.45, margin: '0 0 10px 0' }}>
              {currentQuestion.question}
            </h2>
            <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #64748b)', fontStyle: 'italic' }}>
              💡 Bối cảnh: {currentQuestion.contextPrompt}
            </div>
          </div>

          {/* ASK INTERVIEWER FOR HINT BUTTON */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              style={{
                background: showHint ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                border: '1.5px solid #0284c7',
                borderRadius: '8px',
                color: '#0284c7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{showHint ? '🔼 Ẩn gợi ý' : `🙋‍♂️ Xin gợi ý từ Interviewer (${currentInterviewer.name})`}</span>
            </button>

            {showHint && (
              <div style={{
                marginTop: '12px',
                padding: '14px 18px',
                background: 'var(--ifm-color-emphasis-100, #f0f9ff)',
                border: '1.5px solid #38bdf8',
                borderRadius: '10px',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '13.5px',
                lineHeight: 1.6
              }}>
                <div style={{ fontWeight: 800, color: '#0284c7', marginBottom: '6px' }}>
                  {currentInterviewer.hintPrefix}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #334155)', marginBottom: '8px' }}>
                  Để đạt điểm tuyệt đối với câu hỏi này, bạn cần bao quát được các ý cốt lõi sau:
                </div>
                <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                  {currentQuestion.coreKeyPoints.map((pt, i) => (
                    <li key={pt.id || i} style={{ marginBottom: '6px' }}>
                      <strong>Ý {i + 1}:</strong> {pt.pointText}{' '}
                      <span style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        Chiếm {pt.weight}% điểm
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Candidate Answer Box */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ifm-color-content, #0f172a)' }}>
                Câu trả lời của bạn:
              </label>
              <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                {currentUserAnswer.trim() ? `${currentUserAnswer.trim().split(/\s+/).length} từ` : '0 từ'} • {currentUserAnswer.length} ký tự
              </span>
            </div>

            <textarea
              rows={8}
              value={currentUserAnswer}
              onChange={(e) => setCurrentUserAnswer(e.target.value)}
              placeholder="Nhập câu trả lời chi tiết của bạn tại đây... (Nên trình bày theo cấu trúc: 1. Định nghĩa trực diện -> 2. Cơ chế under-the-hood -> 3. Đánh đổi & ví dụ thực tế)"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1.5px solid var(--ifm-color-emphasis-300, #98A2B3)',
                background: 'var(--ifm-background-color, #f8fafc)',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '14px',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            />

            {submitError && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', fontWeight: 600 }}>
                ⚠️ {submitError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={handleSkipQuestion}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
                color: 'var(--ifm-color-content-secondary, #64748b)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ⏩ Bỏ qua câu này
            </button>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isEvaluating}
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                background: isEvaluating
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: isEvaluating ? 'wait' : 'pointer',
                boxShadow: isEvaluating ? 'none' : '0 4px 14px rgba(14, 165, 233, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {isEvaluating ? (
                <>
                  <span>⏳</span>
                  <span>Interviewer Đang Đánh Giá Câu Trả Lời...</span>
                </>
              ) : (
                <span>✅ Nộp Câu Trả Lời Cho Interviewer</span>
              )}
            </button>
          </div>

          {/* Educational Disclaimer Footnote */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary, #64748b)', fontStyle: 'italic' }}>
            ℹ️ {MOCK_INTERVIEW_DISCLAIMER.shortText}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. EVALUATED PHASE: INTERVIEWER SPOKEN FEEDBACK          */}
      {/* ======================================================== */}
      {phase === 'EVALUATED' && currentEvaluation && currentQuestion && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Spoken Reaction from Interviewer */}
          <div style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'var(--ifm-color-emphasis-100, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: '1 1 300px' }}>
              <span style={{ fontSize: '32px' }}>{currentInterviewer.avatarIcon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ifm-color-content, #0f172a)', marginBottom: '4px' }}>
                  Phản hồi từ {currentInterviewer.name} ({currentCompany.maskedName}):
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #334155)', lineHeight: 1.5 }}>
                  {currentEvaluation.score >= 80
                    ? currentInterviewer.positiveReaction
                    : currentEvaluation.score >= 60
                    ? currentInterviewer.neutralReaction
                    : currentInterviewer.constructiveReaction}
                </div>
              </div>
            </div>
          </div>

          {/* Result Score Banner */}
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
                    KẾT QUẢ ĐÁNH GIÁ • CÂU {currentIndex + 1}
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
                    {currentIndex + 1 < sessionQuestions.length
                      ? 'Tiếp Tục Câu Tiếp Theo ➔'
                      : 'Chuyển Sang Vòng Hỏi Đáp Q&A ➔'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Matched vs Missing Key Points Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', margin: '24px 0' }}>
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
                          Từ khóa nhận diện: {item.matchedKeywords.join(', ')}
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

          {/* Model Answer */}
          <div className="mock-eval-card-model-ans" style={{
            background: 'var(--ifm-background-color, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)',
            borderRadius: '12px',
            padding: '22px',
            marginBottom: '22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--ifm-color-content, #0f172a)' }}>
                Câu Trả Lời Mẫu Chuẩn Senior (10/10 Điểm):
              </h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--ifm-color-content, #1e293b)', whiteSpace: 'pre-line', margin: 0 }}>
              {currentQuestion.idealAnswer}
            </p>
          </div>

          {/* Scoring Criteria & Trap Warning */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CANDIDATE Q&A PHASE: REVERSE INTERVIEW                */}
      {/* ======================================================== */}
      {phase === 'CANDIDATE_QA' && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)',
            paddingBottom: '14px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>💬</span>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 850, margin: 0, color: 'var(--ifm-color-content, #0f172a)' }}>
                  Vòng Hỏi Đáp Ngược (Candidate Q&A)
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                  Đặt câu hỏi cho Interviewer {currentInterviewer.name} tại {currentCompany.maskedName}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: currentCompany.badgeColor,
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '12px'
              }}>
                {currentCompany.maskedName}
              </span>
            </div>
          </div>

          {/* Interviewer Invitation Dialogue */}
          <div style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'var(--ifm-color-emphasis-100, #f8fafc)',
            border: '1.5px solid #38bdf8',
            marginBottom: '22px'
          }}>
            <span style={{ fontSize: '32px' }}>{currentInterviewer.avatarIcon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0284c7', marginBottom: '4px' }}>
                {currentInterviewer.name} ({currentInterviewer.role}):
              </div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--ifm-color-content, #1e293b)' }}>
                "Chúc mừng {candidateName.trim() || 'bạn'} đã hoàn thành xuất sắc các câu hỏi kỹ thuật! Tại {currentCompany.maskedName}, một buổi phỏng vấn luôn là cuộc trò chuyện hai chiều. Bây giờ là thời gian dành cho bạn! Bạn có câu hỏi nào muốn hỏi mình về văn hóa, công nghệ, hoặc cơ hội phát triển ở vị trí {selectedLevel} không?"
              </p>
            </div>
          </div>

          {/* Smart Suggested Questions Chips */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontWeight: 750, fontSize: '13.5px', marginBottom: '10px', color: 'var(--ifm-color-content, #0f172a)' }}>
              💡 Gợi ý câu hỏi thông minh để tạo ấn tượng tốt:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentCompany.candidateQA.map((qa) => {
                const isAlreadyAsked = askedQuestionsHistory.some((item) => item.question === qa.question);
                return (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() => handleAskInterviewer(qa)}
                    disabled={isAlreadyAsked}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: isAlreadyAsked ? '1px solid #cbd5e1' : '1.5px solid #0ea5e9',
                      background: isAlreadyAsked ? 'var(--ifm-color-emphasis-100, #f1f5f9)' : 'var(--ifm-card-background-color, #ffffff)',
                      color: isAlreadyAsked ? 'var(--ifm-color-content-secondary, #94a3b8)' : '#0284c7',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: isAlreadyAsked ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>❓ {qa.question}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>
                      {isAlreadyAsked ? 'Đã hỏi ✓' : 'Bấm để hỏi ➔'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asked Questions Dialog Thread */}
          {askedQuestionsHistory.length > 0 && (
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {askedQuestionsHistory.map((item, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--ifm-color-emphasis-100, #f8fafc)',
                  border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0ea5e9', marginBottom: '6px' }}>
                    🙋‍♂️ Bạn hỏi: "{item.question}"
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content, #1e293b)', lineHeight: 1.6 }}>
                    <strong>{currentInterviewer.name} trả lời:</strong> {item.answer}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Question Input */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '26px' }}>
            <input
              type="text"
              value={customCandidateQuestion}
              onChange={(e) => setCustomCandidateQuestion(e.target.value)}
              placeholder="Hoặc tự gõ câu hỏi riêng của bạn..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
                background: 'var(--ifm-background-color, #f8fafc)',
                color: 'var(--ifm-color-content, #0f172a)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={handleAskCustomQuestion}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#0ea5e9',
                color: '#ffffff',
                border: 'none',
                fontWeight: 750,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Hỏi Interviewer
            </button>
          </div>

          {/* Complete Interview & View Scorecard */}
          <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--ifm-color-emphasis-200, #e2e8f0)' }}>
            <button
              type="button"
              onClick={() => {
                setPhase('SUMMARY');
                if (typeof window !== 'undefined') {
                  containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              style={{
                padding: '14px 38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 850,
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              🏆 Kết Thúc Buổi Phỏng Vấn & Xem Báo Cáo Tuyển Dụng ➔
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SUMMARY PHASE: OFFICIAL HIRING REPORT & SCORECARD     */}
      {/* ======================================================== */}
      {phase === 'SUMMARY' && (
        <div style={{
          background: 'var(--ifm-card-background-color, #ffffff)',
          border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          {/* Top Bar with Company Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1.5px solid var(--ifm-color-emphasis-300, #cbd5e1)',
            paddingBottom: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  background: currentCompany.badgeColor,
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 850,
                  fontSize: '13px'
                }}>
                  {currentCompany.maskedName}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                  HỘI ĐỒNG TUYỂN DỤNG • BÁO CÁO PHỎNG VẤN KỸ THUẬT
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--ifm-color-content, #0f172a)' }}>
                Quyết Định Tuyển Dụng: {candidateName.trim() || 'Ứng Viên'}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                Vị trí: <strong>{currentLevelProfile.title}</strong> • Phỏng vấn viên: <strong>{currentInterviewer.name} ({currentInterviewer.role})</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: summaryStats.decisionBadgeColor,
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '0.04em',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}>
                {summaryStats.hiringDecision}
              </div>
            </div>
          </div>

          {/* Hiring Decision & Summary Score Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '24px',
            borderRadius: '12px',
            background: 'var(--ifm-background-color, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #e2e8f0)',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content-secondary, #64748b)' }}>
                ĐIỂM TRUNG BÌNH TOÀN BUỔI
              </div>
              <div style={{
                fontSize: '3.2rem',
                fontWeight: 900,
                color: summaryStats.avgScore >= 80 ? '#10b981' : summaryStats.avgScore >= 60 ? '#0ea5e9' : '#ef4444'
              }}>
                {summaryStats.avgScore}<span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>/100</span>
              </div>
            </div>

            <div style={{ maxWidth: '440px' }}>
              <div style={{ fontWeight: 850, fontSize: '16px', color: 'var(--ifm-color-content, #0f172a)', marginBottom: '6px' }}>
                {summaryStats.decisionLabel}
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #475569)', lineHeight: 1.5 }}>
                {summaryStats.avgScore >= currentLevelProfile.strongHireThresholdScore
                  ? `Xuất sắc! Bạn thể hiện tư duy vượt trội, khả năng diễn đạt logic và hiểu sâu cơ chế under-the-hood. Đủ điều kiện nhận offer cho vị trí ${selectedLevel} tại ${currentCompany.maskedName}.`
                  : summaryStats.avgScore >= currentLevelProfile.passThresholdScore
                  ? `Chúc mừng bạn! Bạn đã vượt qua ngưỡng tuyển dụng (Pass bar >= ${currentLevelProfile.passThresholdScore} điểm) cho vị trí ${selectedLevel}. Hãy rèn luyện thêm một số cạm bẫy thực tế để tự tin nhận offer cao nhất.`
                  : `Bạn đã nắm được các nét cơ bản, tuy nhiên chưa đạt ngưỡng điểm chuẩn (${currentLevelProfile.passThresholdScore} điểm) cho vị trí ${selectedLevel}. Hãy xem lại các ý bị thiếu trong dàn ý và ôn tập kỹ trước buổi phỏng vấn thật.`}
              </p>
            </div>
          </div>

          {/* Personalised Feedback Letter from Interviewer */}
          <div style={{
            padding: '20px 24px',
            borderRadius: '12px',
            background: 'var(--ifm-color-emphasis-100, #f8fafc)',
            border: '1.5px solid var(--ifm-color-emphasis-300, #cbd5e1)',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>✍️</span>
              <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ifm-color-content, #0f172a)' }}>
                Lời Nhận Xét Từ Interviewer {currentInterviewer.name} @ {currentCompany.maskedName}:
              </span>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--ifm-color-content, #334155)', margin: 0, fontStyle: 'italic' }}>
              "Chào {candidateName.trim() || 'bạn'}, mình đánh giá cao sự tự tin và tinh thần cầu thị của bạn trong buổi phỏng vấn hôm nay.
              {summaryStats.avgScore >= 75
                ? ' Khả năng phân tích của bạn rất có cấu trúc, biết liên hệ giữa lý thuyết và thực tiễn.'
                : ' Bạn có tiềm năng phát triển tốt, chỉ cần đào sâu thêm vào mô hình bộ nhớ JVM và các câu lệnh giải thích query.'}
              {' '}Chúc bạn luôn giữ vững đam mê với ngành công nghệ!"
            </p>
          </div>

          {/* Topic Breakdown */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: 'var(--ifm-color-content, #0f172a)' }}>
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
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: score >= 80 ? '#10b981' : score >= 60 ? '#0ea5e9' : '#ef4444' }}>
                  {score} điểm
                </div>
              </div>
            ))}
          </div>

          {/* Question By Question Review with DÀN Ý */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: 'var(--ifm-color-content, #0f172a)' }}>
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
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ifm-color-content, #0f172a)' }}>
                        {item.question.question}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        background: item.evaluation.score >= 80 ? '#dcfce7' : item.evaluation.score >= 60 ? '#e0f2fe' : '#fee2e2',
                        color: item.evaluation.score >= 80 ? '#15803d' : item.evaluation.score >= 60 ? '#0369a1' : '#b91c1c'
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setPhase('SETUP');
                setActiveSetupTab('interview');
              }}
              style={{
                padding: '12px 28px',
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
              🔄 Thử Sức Với Công Ty Khác (A***, N***, S***...)
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
                onClick={() => onSwitchTab('tips50')}
                style={{
                  padding: '12px 24px',
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
                💡 Ôn Tập 50 Thực Chiến Tips
              </button>
            ) : null}
          </div>

          {/* Full Educational Disclaimer Card */}
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'var(--ifm-background-color, #f8fafc)',
            border: '1px solid var(--ifm-color-emphasis-300, #cbd5e1)',
            marginTop: '28px'
          }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#b45309', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚖️</span>
              <span>TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (EDUCATIONAL DISCLAIMER)</span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary, #475569)', lineHeight: 1.6 }}>
              {MOCK_INTERVIEW_DISCLAIMER.fullText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

