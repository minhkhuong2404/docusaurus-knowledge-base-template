import React, { useState, useEffect, useMemo } from 'react';
import {
  DAILY_MICRO_CHALLENGES,
  CV_PROJECT_TEMPLATES,
  CAREER_LEVEL_PROFILES,
  INCIDENT_WAR_ROOM_SCENARIOS,
  upgradeCustomCvBullet,
  computeCareerReadiness
} from '../../data/careerHubInteractiveData';
import {
  PRACTICE_HISTORY_STORAGE_KEY,
  PracticeHistoryEntry
} from '../../data/mockInterviewPracticeData';

const DAILY_STORAGE_KEY = 'career_hub_daily_solved_v1';

function readBestMockScore(defaultScore = 0): number {
  try {
    if (typeof localStorage === 'undefined') return defaultScore;
    const raw = localStorage.getItem(PRACTICE_HISTORY_STORAGE_KEY);
    if (!raw) return defaultScore;
    const parsed = JSON.parse(raw) as PracticeHistoryEntry[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return Math.max(...parsed.map((h) => h.avgScore || 0));
    }
  } catch (e) {}
  return defaultScore;
}

interface ReadinessBannerProps {
  probationPercent: number;
  onOpenMockInterview: () => void;
}

/**
 * 1. Compact Hero Bar: Career Readiness Meter + Expandable Daily 60s Micro-Challenge + Mock Interview CTA
 */
export function CareerReadinessAndDailyBanner({
  probationPercent,
  onOpenMockInterview
}: ReadinessBannerProps): React.JSX.Element {
  const [selectedDailyIndex, setSelectedDailyIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [solvedDailyMap, setSolvedDailyMap] = useState<Record<string, boolean>>({});
  const [mockBestScore, setMockBestScore] = useState<number>(0);
  const [isDailyExpanded, setIsDailyExpanded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedDaily = localStorage.getItem(DAILY_STORAGE_KEY);
      if (savedDaily) setSolvedDailyMap(JSON.parse(savedDaily));
    } catch (e) {}

    setMockBestScore(readBestMockScore(0));

    const dayIdx = new Date().getDay() % DAILY_MICRO_CHALLENGES.length;
    setSelectedDailyIndex(dayIdx);
  }, []);

  const currentChallenge = DAILY_MICRO_CHALLENGES[selectedDailyIndex] || DAILY_MICRO_CHALLENGES[0];
  const solvedDailyCount = Object.values(solvedDailyMap).filter(Boolean).length;

  const readiness = useMemo(() => {
    return computeCareerReadiness({
      probationPercent,
      mockBestScore,
      solvedDailyCount,
      masteredFlashcardsCount: 0
    });
  }, [probationPercent, mockBestScore, solvedDailyCount]);

  const handleSelectDailyOption = (optionId: string, isCorrect: boolean) => {
    setSelectedOptionId(optionId);
    if (isCorrect) {
      const updated = { ...solvedDailyMap, [currentChallenge.id]: true };
      setSolvedDailyMap(updated);
      try {
        localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '18px auto 0 auto', textAlign: 'left' }}>
      <div
        className="hub-card"
        style={{
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          background: 'rgba(15, 23, 42, 0.55)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14.5px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)' }}>
              🧭 Mức Độ Sẵn Sàng Nhận Offer:
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: readiness.rankColor }}>
              {readiness.readinessScore}%
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.14)',
                color: readiness.rankColor,
                border: `1px solid ${readiness.rankColor}`
              }}
            >
              {readiness.rankTitle}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsDailyExpanded(!isDailyExpanded)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                border: '1px solid #f59e0b',
                background: isDailyExpanded ? 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)' : 'rgba(245, 158, 11, 0.14)',
                color: isDailyExpanded ? '#0f172a' : 'var(--ifm-color-content, #0f172a)'
              }}
            >
              ⚡ {isDailyExpanded ? 'Thu Gọn Câu Đố 60s' : `Câu Đố 60s Hôm Nay (${solvedDailyCount}/${DAILY_MICRO_CHALLENGES.length})`}
            </button>

            <button
              type="button"
              onClick={onOpenMockInterview}
              style={{
                padding: '7px 15px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                color: '#0f172a'
              }}
            >
              🎙️ Vào Phòng Phỏng Vấn AI ➔
            </button>
          </div>
        </div>

        <div style={{ width: '100%', height: '7px', background: 'rgba(148, 163, 184, 0.25)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${readiness.readinessScore}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0ea5e9 0%, #10b981 100%)',
              transition: 'width 0.35s ease'
            }}
          />
        </div>
      </div>

      {isDailyExpanded && (
        <div
          className="hub-card"
          style={{
            marginTop: '12px',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '2px solid rgba(245, 158, 11, 0.45)',
            background: 'rgba(15, 23, 42, 0.75)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 9px', borderRadius: '6px', background: '#fef3c7', color: '#92400e', marginRight: '8px' }}>
                {currentChallenge.dayLabel}
              </span>
              <span style={{ fontSize: '15.5px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)' }}>
                {currentChallenge.title}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DAILY_MICRO_CHALLENGES.map((ch, idx) => {
                const isSolved = !!solvedDailyMap[ch.id];
                const isCurr = idx === selectedDailyIndex;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setSelectedDailyIndex(idx);
                      setSelectedOptionId(null);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isCurr ? '2px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.35)',
                      background: isSolved ? '#dcfce7' : isCurr ? '#fef3c7' : 'rgba(148, 163, 184, 0.14)',
                      color: isSolved ? '#166534' : isCurr ? '#92400e' : 'var(--ifm-color-content, #0f172a)'
                    }}
                  >
                    #{idx + 1} {isSolved ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <pre
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              lineHeight: 1.55,
              overflowX: 'auto',
              border: '1px solid #334155',
              marginBottom: '10px'
            }}
          >
            <code>{currentChallenge.codeOrScenario}</code>
          </pre>

          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content, #0f172a)', marginBottom: '10px' }}>
            ❓ {currentChallenge.question}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentChallenge.options.map((opt) => {
              const isPicked = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectDailyOption(opt.id, opt.isCorrect)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    border: isPicked
                      ? opt.isCorrect
                        ? '2px solid #10b981'
                        : '2px solid #ef4444'
                      : '1px solid rgba(148, 163, 184, 0.35)',
                    background: isPicked
                      ? opt.isCorrect
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(148, 163, 184, 0.08)',
                    color: 'var(--ifm-color-content, #0f172a)'
                  }}
                >
                  <div>{opt.text}</div>
                  {isPicked && (
                    <div style={{ marginTop: '5px', fontSize: '12.5px', fontWeight: 600, color: opt.isCorrect ? '#10b981' : '#ef4444' }}>
                      {opt.explanation}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedOptionId && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.12)',
                borderLeft: '4px solid #0ea5e9',
                fontSize: '13px',
                color: 'var(--ifm-color-content, #0f172a)'
              }}
            >
              <strong>💡 Ghi nhớ:</strong> {currentChallenge.takeaway}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 3. 2:00 AM Production Incident War-Room Simulator — Integrated inside the "Trường Học vs Đi Làm" tab
 */
export function IncidentWarRoomSection(): React.JSX.Element {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [systemHp, setSystemHp] = useState<number>(100);
  const [stagePickedChoiceId, setStagePickedChoiceId] = useState<string | null>(null);
  const [incidentCompleted, setIncidentCompleted] = useState<boolean>(false);

  const activeScenario = INCIDENT_WAR_ROOM_SCENARIOS[selectedScenarioIdx] || INCIDENT_WAR_ROOM_SCENARIOS[0];
  const activeStage = activeScenario.stages[currentStageIdx] || activeScenario.stages[0];

  const handlePickIncidentChoice = (choiceId: string, hpDelta: number) => {
    setStagePickedChoiceId(choiceId);
    setSystemHp((prev) => Math.max(10, Math.min(100, prev + hpDelta)));
  };

  const handleNextIncidentStage = () => {
    if (currentStageIdx + 1 < activeScenario.stages.length) {
      setCurrentStageIdx(currentStageIdx + 1);
      setStagePickedChoiceId(null);
    } else {
      setIncidentCompleted(true);
    }
  };

  const handleResetIncident = (newScenarioIdx?: number) => {
    if (typeof newScenarioIdx === 'number') {
      setSelectedScenarioIdx(newScenarioIdx);
    }
    setCurrentStageIdx(0);
    setSystemHp(100);
    setStagePickedChoiceId(null);
    setIncidentCompleted(false);
  };

  return (
    <div className="hub-card" style={{ borderRadius: '14px', padding: '24px', border: '2px solid rgba(239, 68, 68, 0.45)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 900, background: '#fee2e2', color: '#991b1b', marginRight: '10px' }}>
            🚨 {activeScenario.severity} • {activeScenario.timeTag}
          </span>
          <span style={{ fontSize: '17.5px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)' }}>
            {activeScenario.title}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {INCIDENT_WAR_ROOM_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleResetIncident(idx)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                border: selectedScenarioIdx === idx ? '2px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.35)',
                background: selectedScenarioIdx === idx ? '#fee2e2' : 'transparent',
                color: selectedScenarioIdx === idx ? '#991b1b' : 'var(--ifm-color-content, #0f172a)'
              }}
            >
              Ca Trực #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#0f172a', color: '#f8fafc', marginBottom: '18px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px', fontWeight: 800 }}>
          <span>📟 PagerDuty Alert: {activeScenario.alertBanner}</span>
          <span style={{ color: systemHp >= 75 ? '#34d399' : systemHp >= 45 ? '#fbbf24' : '#f87171' }}>
            ❤️ Sức Khỏe Hệ Thống (SLA HP): {systemHp}%
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${systemHp}%`,
              height: '100%',
              background: systemHp >= 75 ? '#10b981' : systemHp >= 45 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {!incidentCompleted ? (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0ea5e9', marginBottom: '4px' }}>
            Chặng {activeStage.stageNumber} / {activeScenario.stages.length}: {activeStage.stageTitle}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ifm-color-content, #0f172a)', marginBottom: '14px', lineHeight: 1.6 }}>
            {activeStage.situationText}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {activeStage.choices.map((ch) => {
              const isPicked = stagePickedChoiceId === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handlePickIncidentChoice(ch.id, ch.hpDelta)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: isPicked
                      ? ch.isOptimal
                        ? '2px solid #10b981'
                        : '2px solid #ef4444'
                      : '1px solid rgba(148, 163, 184, 0.35)',
                    background: isPicked
                      ? ch.isOptimal
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(148, 163, 184, 0.06)',
                    color: 'var(--ifm-color-content, #0f172a)'
                  }}
                >
                  <div>{ch.actionText}</div>
                  {isPicked && (
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: ch.isOptimal ? '#10b981' : '#ef4444' }}>
                      {ch.outcomeFeedback}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {stagePickedChoiceId && (
            <button
              type="button"
              onClick={handleNextIncidentStage}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                color: '#0f172a'
              }}
            >
              {currentStageIdx + 1 < activeScenario.stages.length ? 'Tiếp Tục Chặng Tiếp Theo ➔' : 'Xem Tổng Kết Post-Mortem ➔'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)' }}>
            ✅ Hoàn Tất Ca Trực! Sức Khỏe Hệ Thống Còn Lại: {systemHp}%
          </h4>
          <p style={{ margin: '0 0 14px 0', fontSize: '14px', lineHeight: 1.6, color: 'var(--ifm-color-content, #0f172a)' }}>
            <strong>📘 Bài học Post-Mortem để kể trong buổi phỏng vấn:</strong> {activeScenario.postMortemLesson}
          </p>
          <button
            type="button"
            onClick={() => handleResetIncident()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
              background: '#10b981',
              color: '#0f172a'
            }}
          >
            🔄 Thực Hành Lại Ca Trực Này
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 4. CV Doctor (Google XYZ Upgrader) + Level & Compensation Explorer — Integrated inside the "Bí Kíp CV & Khung Lương" tab
 */
export function CvDoctorAndSalarySection(): React.JSX.Element {
  const [selectedCvTemplateId, setSelectedCvTemplateId] = useState<string>(CV_PROJECT_TEMPLATES[0].id);
  const [customRawCv, setCustomRawCv] = useState<string>('Làm chức năng đặt hàng và thanh toán cho website bán sách bằng Spring Boot và MySQL');
  const [customCvFocus, setCustomCvFocus] = useState<'performance' | 'concurrency' | 'reliability'>('performance');
  const [copiedCvText, setCopiedCvText] = useState<string | null>(null);

  const [selectedLevel, setSelectedLevel] = useState<'Intern' | 'Fresher' | 'Junior' | 'Middle'>('Fresher');
  const [selectedCompanyType, setSelectedCompanyType] = useState<'Outsourcing' | 'Product' | 'Fintech' | 'BigTech'>('Product');

  const handleCopyText = (text: string, tag: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCvText(tag);
      setTimeout(() => setCopiedCvText(null), 2000);
    }
  };

  const activeCvTemplate = CV_PROJECT_TEMPLATES.find((t) => t.id === selectedCvTemplateId) || CV_PROJECT_TEMPLATES[0];
  const customUpgradedResult = useMemo(() => {
    return upgradeCustomCvBullet(customRawCv, customCvFocus);
  }, [customRawCv, customCvFocus]);

  const activeLevelProfile = useMemo(() => {
    return (
      CAREER_LEVEL_PROFILES.find((p) => p.level === selectedLevel && p.companyType === selectedCompanyType) ||
      CAREER_LEVEL_PROFILES.find((p) => p.level === selectedLevel) ||
      CAREER_LEVEL_PROFILES[0]
    );
  }, [selectedLevel, selectedCompanyType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '22px' }}>
      {/* Part A: Google XYZ CV Upgrader */}
      <div className="hub-card" style={{ borderRadius: '14px', padding: '22px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)' }}>
          🩺 Bác Sĩ Sửa CV Thực Chiến (Công Thức Google XYZ)
        </h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #475569)' }}>
          Chọn loại dự án của bạn để lấy mẫu câu chuẩn kỹ sư, hoặc nhập mô tả đồ án bên dưới để tự động nâng cấp:
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {CV_PROJECT_TEMPLATES.map((tpl) => {
            const isSelected = tpl.id === selectedCvTemplateId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedCvTemplateId(tpl.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #10b981' : '1px solid rgba(148, 163, 184, 0.35)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.08)',
                  color: 'var(--ifm-color-content, #0f172a)'
                }}
              >
                {tpl.icon} {tpl.projectType}
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid #ef4444',
            marginBottom: '14px'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', marginBottom: '3px' }}>
            ❌ Câu mô tả đồ án đại trà (Dễ bị loại):
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content, #0f172a)' }}>
            {activeCvTemplate.weakBullet}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          {activeCvTemplate.upgradedBullets.map((b, idx) => {
            const copyTag = `${activeCvTemplate.id}-${idx}`;
            return (
              <div
                key={copyTag}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  background: 'rgba(16, 185, 129, 0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ padding: '2px 9px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                    ✅ Mẫu #{idx + 1}: {b.focus}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(b.xyzText, copyTag)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: '1px solid #10b981',
                      background: copiedCvText === copyTag ? '#10b981' : 'transparent',
                      color: copiedCvText === copyTag ? '#0f172a' : 'var(--ifm-color-content, #0f172a)'
                    }}
                  >
                    {copiedCvText === copyTag ? '✓ Đã Copy!' : '📋 Copy Câu Này'}
                  </button>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.55, color: 'var(--ifm-color-content, #0f172a)' }}>
                  "{b.xyzText}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Bullet Upgrader */}
        <div style={{ borderTop: '1px dashed rgba(148, 163, 184, 0.35)', paddingTop: '16px' }}>
          <div style={{ fontSize: '14.5px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)', marginBottom: '8px' }}>
            ✨ Tự nâng cấp câu mô tả đồ án của riêng bạn:
          </div>
          <textarea
            rows={2}
            value={customRawCv}
            onChange={(e) => setCustomRawCv(e.target.value)}
            placeholder="Nhập câu mô tả đồ án thô của bạn..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '13.5px',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              background: 'rgba(15, 23, 42, 0.04)',
              color: 'var(--ifm-color-content, #0f172a)',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[
              { id: 'performance', label: '⚡ Nhấn mạnh Hiệu năng & SQL/Index' },
              { id: 'concurrency', label: '🛡️ Nhấn mạnh Transaction & Locking' },
              { id: 'reliability', label: '🔐 Nhấn mạnh JWT, Redis & Unit Test' }
            ].map((fc) => (
              <button
                key={fc.id}
                type="button"
                onClick={() => setCustomCvFocus(fc.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: customCvFocus === fc.id ? '2px solid #0ea5e9' : '1px solid rgba(148, 163, 184, 0.35)',
                  background: customCvFocus === fc.id ? 'rgba(14, 165, 233, 0.16)' : 'transparent',
                  color: 'var(--ifm-color-content, #0f172a)'
                }}
              >
                {fc.label}
              </button>
            ))}
          </div>
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(14, 165, 233, 0.09)',
              border: '1px solid rgba(14, 165, 233, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 700, lineHeight: 1.55, color: 'var(--ifm-color-content, #0f172a)' }}>
              {customUpgradedResult}
            </div>
            <button
              type="button"
              onClick={() => handleCopyText(customUpgradedResult, 'custom-cv')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                color: '#0f172a'
              }}
            >
              {copiedCvText === 'custom-cv' ? '✓ Đã Copy!' : '📋 Copy Câu CV Mới'}
            </button>
          </div>
        </div>
      </div>

      {/* Part B: Level & Compensation Map */}
      <div className="hub-card" style={{ borderRadius: '14px', padding: '22px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)' }}>
          💰 Bản Đồ Cấp Bậc Kỹ Năng & Khung Thu Nhập Tham Khảo
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content-secondary, #475569)' }}>Cấp bậc:</span>
            {(['Intern', 'Fresher', 'Junior', 'Middle'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '6px 13px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: selectedLevel === lvl ? '2px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.35)',
                  background: selectedLevel === lvl ? '#fef3c7' : 'rgba(148, 163, 184, 0.08)',
                  color: selectedLevel === lvl ? '#92400e' : 'var(--ifm-color-content, #0f172a)'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content-secondary, #475569)' }}>Mô hình:</span>
            {[
              { id: 'Outsourcing', label: '🏢 Outsourcing' },
              { id: 'Product', label: '🚀 Product' },
              { id: 'Fintech', label: '🏦 Fintech / Bank' },
              { id: 'BigTech', label: '🌐 Big Tech' }
            ].map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => setSelectedCompanyType(comp.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  border: selectedCompanyType === comp.id ? '2px solid #0ea5e9' : '1px solid rgba(148, 163, 184, 0.35)',
                  background: selectedCompanyType === comp.id ? '#e0f2fe' : 'rgba(148, 163, 184, 0.08)',
                  color: selectedCompanyType === comp.id ? '#0369a1' : 'var(--ifm-color-content, #0f172a)'
                }}
              >
                {comp.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--ifm-color-content-secondary, #475569)' }}>💵 KHUNG THU NHẬP (GROSS):</div>
            <div style={{ fontSize: '19px', fontWeight: 900, color: '#10b981', marginTop: '3px' }}>{activeLevelProfile.salaryRangeVnd}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content, #0f172a)', marginTop: '3px' }}>
              {activeLevelProfile.companyTypeLabel} • {activeLevelProfile.level}
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.35)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--ifm-color-content-secondary, #475569)' }}>🎯 VÒNG PHỎNG VẤN ĐIỂN HÌNH:</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content, #0f172a)', marginTop: '5px', lineHeight: 1.5 }}>
              {activeLevelProfile.interviewRounds}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)', marginBottom: '8px' }}>
              ✅ Kỹ Năng Bắt Buộc (Must-Have)
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', lineHeight: 1.5, color: 'var(--ifm-color-content, #0f172a)' }}>
              {activeLevelProfile.mustHaveSkills.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--ifm-color-content, #0f172a)', marginBottom: '8px' }}>
              🌟 Điểm Cộng Deal Lương Cao
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', lineHeight: 1.5, color: 'var(--ifm-color-content, #0f172a)' }}>
              {activeLevelProfile.bonusDifferentiators.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
