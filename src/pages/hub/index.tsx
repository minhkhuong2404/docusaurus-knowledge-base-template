import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { FIFTY_PRACTICAL_TIPS, PracticalTip } from '../../data/hubFiftyTipsData';
import { INTERVIEW_QUESTIONS, InterviewQuestion } from '../../data/hubInterviewQuestionsData';
import { KNOWLEDGE_MODULES, KnowledgeModule, LessonTopic } from '../../data/hubKnowledgeModulesData';
import { CODE_BATTLES, CodeBattle } from '../../data/hubCodeBattlesData';
import MockInterviewStudio from '../../components/mock-interview/MockInterviewStudio';
import SeniorInterview5120Suite from '../../components/career-hub/SeniorInterview5120Suite';
import {
  CareerReadinessAndDailyBanner,
  IncidentWarRoomSection,
  CvDoctorAndSalarySection
} from '../../components/career-hub/CareerHubInteractiveSuite';

// ==========================================
// 2. DATA: CV & JOB HUNTING STRATEGY
// ==========================================

interface CvSectionBreakdown {
  sectionTitle: string;
  doThis: string[];
  dontDoThis: string[];
  exampleText: string;
}

const CV_SECTIONS: CvSectionBreakdown[] = [
  {
    sectionTitle: '1. Mô Tả Dự Án Cá Nhân (Project Experience)',
    doThis: [
      'Áp dụng công thức Google XYZ: Đạt được [X], đo lường bằng [Y], bằng cách làm [Z].',
      'Đính kèm đường dẫn GitHub repo có commit đều đặn và tài liệu Swagger/Postman API rõ ràng.',
      'Nêu rõ các thách thức kỹ thuật bạn đã trực tiếp giải quyết (N+1 query, JWT security, Redis cache).'
    ],
    dontDoThis: [
      'Ghi dự án Todo App, Quản lý sinh viên console đơn giản sao chép trên mạng.',
      'Chỉ liệt kê công nghệ dạng danh sách: "Java, Spring, MySQL" mà không nói dùng để làm gì.',
      'Viết chung chung: "Làm chức năng đăng nhập và thanh toán".'
    ],
    exampleText: '✅ "Xây dựng hệ thống E-commerce Backend phục vụ 500+ SKU; thiết kế RESTful API chuẩn RFC 7807; tối ưu hóa thời gian phản hồi API danh sách đơn hàng giảm 60% (từ 700ms xuống 280ms) bằng cách xử lý N+1 Query với JOIN FETCH và thiết lập B-Tree Index trên PostgreSQL; viết 25+ Unit & Integration Tests đạt 82% Code Coverage."'
  },
  {
    sectionTitle: '2. Kỹ Năng Kỹ Thuật (Technical Skills)',
    doThis: [
      'Phân nhóm chuyên nghiệp: Languages (Java 17/21, SQL), Frameworks (Spring Boot 3, Spring Data JPA), Tools (Docker, Git, Maven, Postman), Testing (JUnit 5, Mockito).',
      'Chỉ ghi những công nghệ bạn thực sự hiểu bản chất và có thể trả lời khi bị phỏng vấn đào sâu.'
    ],
    dontDoThis: [
      'Vẽ thanh phần trăm (%): "Java 85%, Spring 70%" (Hoàn toàn vô nghĩa và bị trừ điểm).',
      'Nhồi nhét từ khóa đao to búa lớn (Kafka, Kubernetes, Microservices, CI/CD) khi chỉ mới đọc lướt qua lý thuyết.'
    ],
    exampleText: '✅ Languages: Java (17/21), SQL (PostgreSQL, MySQL)\nFrameworks & Libraries: Spring Boot 3, Spring Data JPA, Spring Security (JWT), Hibernate, Lombok\nTesting: JUnit 5, Mockito, MockMvc\nDevOps & Tools: Docker, Docker Compose, Git, Maven, Postman, IntelliJ IDEA'
  },
  {
    sectionTitle: '3. Học Vấn, Điểm Số & Môn Học Trọng Tâm (Education & GPA)',
    doThis: [
      'Ghi rõ trường Đại học, chuyên ngành (Công nghệ Thông tin / Khoa học Máy tính) và năm tốt nghiệp dự kiến.',
      'Nếu GPA >= 3.0 / 4.0 (hoặc >= 7.5 / 10), hãy tự tin làm nổi bật trong CV.',
      'Liệt kê các môn học nền tảng kỹ thuật then chốt: Cấu trúc dữ liệu & Giải thuật, Hệ quản trị cơ sở dữ liệu, Lập trình hướng đối tượng (OOP), Mạng máy tính, Hệ điều hành.'
    ],
    dontDoThis: [
      'Nếu GPA dưới 2.5 thì không nên đưa vào mục tiêu điểm; thay vào đó hãy bù đắp bằng dự án thực chiến và link GitHub chất lượng.',
      'Liệt kê các môn đại cương không liên quan (Triết học, Thể dục, Pháp luật đại cương).',
      'Khai gian điểm số hoặc gian lận xếp loại học lực (sẽ bị phát hiện ngay khi nộp bảng điểm lúc nhận việc).'
    ],
    exampleText: '✅ "Đại học Bách Khoa Hà Nội — Chuyên ngành Khoa học Máy tính (2022 - 2026)\nGPA: 3.42 / 4.0 (Top 10% khóa)\nMôn học trọng tâm: Data Structures & Algorithms (A), Database Management Systems (A+), Object-Oriented Programming (A), Computer Networks (B+)\nGiải thưởng: Học bổng Khuyến khích học tập 3 kỳ liên tiếp."'
  },
  {
    sectionTitle: '4. Kinh Nghiệm Thực Tập & Đồ Án Tốt Nghiệp (Work Experience)',
    doThis: [
      'Nếu chưa từng đi làm công ty: Hãy viết Đồ án tốt nghiệp, Research Lab tại trường hoặc Dự án Capstone theo chuẩn của một vị trí kỹ sư Backend.',
      'Nêu rõ vai trò của bạn (Sole Developer hay Backend Lead nhóm 4 người), quy trình làm việc (Agile/Scrum, Git Flow, Jira sprint 2 tuần).',
      'Làm nổi bật tác động thực tế: Số lượng API đã viết, tỷ lệ test coverage, hiệu năng cải thiện trước và sau khi tối ưu.'
    ],
    dontDoThis: [
      'Bỏ trống phần kinh nghiệm và than thở: "Em là sinh viên mới ra trường nên chưa có kinh nghiệm gì".',
      'Kể lể các công việc bán thời gian không liên quan đến IT (phục vụ bàn, bán hàng online) chiếm quá nhiều diện tích CV.',
      'Viết trách nhiệm mơ hồ: "Tham gia phát triển dự án cùng nhóm và sửa một số lỗi".'
    ],
    exampleText: '✅ "Backend Engineering Intern — ABC Tech Solution (06/2025 - 12/2025)\n• Thiết kế và phát triển 12 RESTful endpoints cho phân hệ Quản lý Kho hàng bằng Spring Boot 3 và PostgreSQL.\n• Tái cấu trúc cơ sở dữ liệu và đánh B-Tree Composite Index giúp giảm thời gian truy vấn báo cáo tồn kho từ 2.4s xuống 320ms.\n• Viết bộ Integration Tests với Testcontainers (PostgreSQL & Redis) đạt 85% line coverage, tích hợp vào GitHub Actions CI pipeline.\n• Phối hợp cùng 2 Frontend Dev và 1 QA theo quy trình Scrum, hoàn thành 100% story points trong 6 sprints liên tiếp."'
  },
  {
    sectionTitle: '5. Chiến Lược GitHub Repo & Portfolio 30 Giây (GitHub Strategy)',
    doThis: [
      'Đặt tên repo ngắn gọn, chuyên nghiệp (ví dụ: ecommerce-backend-api, booking-engine-service).',
      'Đầu tư file README.md như một trang sản phẩm: Có sơ đồ kiến trúc (Architecture Diagram), hướng dẫn chạy 1-click bằng "docker compose up", và tài liệu Swagger UI.',
      'Lịch sử commit đều đặn, commit message tuân thủ Conventional Commits (feat:, fix:, refactor:, test:).'
    ],
    dontDoThis: [
      'Dẫn link GitHub rỗng hoặc chỉ có 1 commit duy nhất "Initial commit" chứa toàn bộ mã nguồn đẩy lên một lần.',
      'Đẩy các file rác (.DS_Store, target/, .idea/, node_modules/) lên repo vì thiếu file .gitignore.',
      'Để lộ các thông tin bí mật (DB Password, API Key, Token bí mật) trong commit history.'
    ],
    exampleText: '✅ GitHub README chuẩn mực bao gồm:\n1. Tech Stack Badges (Java 21, Spring Boot 3, PostgreSQL, Docker, Redis)\n2. Architecture Flowchart (Mermaid / SVG minh họa luồng dữ liệu qua Spring Security & Database)\n3. Quick Start (Chỉ cần gõ: docker compose up -d && ./mvnw spring-boot:run)\n4. API Documentation (Đường link Swagger UI: http://localhost:8080/swagger-ui.html)\n5. CI/CD Status Badge (GitHub Actions: Build Passing 100%)'
  },
  {
    sectionTitle: '6. Những Lỗi "Chết Người" Khiến CV Bị Loại Từ Vòng Gửi Xe (Fatal Red Flags)',
    doThis: [
      'Xuất file dưới định dạng PDF chuẩn, đặt tên file chuyên nghiệp: "NguyenVanA_Java_Backend_Junior.pdf".',
      'Độ dài hoàn hảo cho Intern/Fresher là đúng 1 TRANG A4 (tối đa 2 trang nếu dự án có chiều sâu đặc biệt).',
      'Viết email ứng tuyển (Cover Letter) ngắn gọn 3 đoạn lịch sự: Giới thiệu bản thân - Lý do phù hợp với JD - Lời cảm ơn và đính kèm CV.'
    ],
    dontDoThis: [
      'Gửi file .doc / .docx (rất dễ bị lệch format, vỡ font chữ trên máy của HR).',
      'Đặt tên file cẩu thả: "CV.pdf", "CV_moi.pdf", "Ban_sao_CV(1).pdf".',
      'Sai chính tả các từ khóa kỹ thuật cơ bản: "Jav", "springboot", "MySql", "postman", "git hub" (Đánh mất 100% ấn tượng chuyên nghiệp).',
      'Sử dụng địa chỉ email thiếu nghiêm túc thời học sinh: "hoangtubuon9x@gmail.com", "boydeptrai_hp@yahoo.com".',
      'Gửi email apply mà tiêu đề hoặc nội dung email để trống trơn, chỉ đính kèm mỗi file PDF.'
    ],
    exampleText: '✅ Tiêu đề email chuẩn mực:\n"[Họ và Tên] — Ứng Tuyển Vị Trí Java Backend Fresher / Junior"\n\nNội dung email:\n"Kính gửi Ban Tuyển dụng và Bộ phận Kỹ thuật [Tên Công ty],\nEm tên là Nguyễn Văn A, tốt nghiệp chuyên ngành CNTT trường Đại học ABC. Qua tìm hiểu, em được biết Quý công ty đang mở tuyển vị trí Java Backend Fresher...\nEm xin gửi kèm CV tổng hợp kinh nghiệm dự án Spring Boot, tối ưu SQL và link GitHub cá nhân. Em rất mong có cơ hội được trao đổi trực tiếp trong buổi phỏng vấn sắp tới.\nEm xin chân thành cảm ơn!"'
  }
];



// ==========================================
// 3. DOCUMENTATION FORMATTER HELPERS
// ==========================================

function parseInlineMarkdown(text: string, accentColor: string = '#38bdf8'): (string | React.JSX.Element)[] {
  const parts: (string | React.JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={`b-${match.index}`} style={{ color: 'var(--ifm-color-content, #ffffff)', fontWeight: 700 }}>
          {boldText}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={`c-${match.index}`}
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.88em',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}
        >
          {codeText}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }
  return parts;
}

function FormattedDocContent({ text, accentColor }: { text: string; accentColor: string }): React.JSX.Element {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-blk-${i}`} style={{
            margin: '14px 0 18px 0',
            background: '#090d16',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.05em'
            }}>
              <span>{codeLang.toUpperCase() || 'SNIPPET'}</span>
            </div>
            <pre style={{ margin: 0, padding: '14px 16px', fontSize: '13.5px', background: 'transparent', color: '#e2e8f0', lineHeight: 1.55, overflowX: 'auto' }}>
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().replace('```', '');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} style={{ height: '8px' }} />);
      continue;
    }

    // Numbered item: e.g. "1. **Title:** text" or "1. **Title**"
    const numberedMatch = trimmed.match(/^([0-9]+)\.\s*\*\*(.*?)\*\*(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const heading = numberedMatch[2];
      const rest = numberedMatch[3];
      elements.push(
        <div key={`num-${i}`} style={{
          marginTop: '16px',
          marginBottom: '10px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.025)',
          borderLeft: `4px solid ${accentColor}`,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: rest && rest.trim() ? '6px' : '0' }}>
            <span style={{
              background: accentColor,
              color: '#000000',
              fontWeight: 900,
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {num}
            </span>
            <span style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--ifm-color-content, #ffffff)' }}>
              {heading}
            </span>
          </div>
          {rest && rest.trim() && (
            <div style={{ fontSize: '14.5px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.85))', lineHeight: 1.65, paddingLeft: '28px' }}>
              {parseInlineMarkdown(rest.trim().replace(/^:\s*/, ''), accentColor)}
            </div>
          )}
        </div>
      );
      continue;
    }

    // Callout alert line: e.g. "⚠️ ...", "❌ ...", "👉 ...", "✅ ..."
    if (trimmed.startsWith('⚠️') || trimmed.startsWith('❌') || trimmed.startsWith('👉') || trimmed.startsWith('✅')) {
      const isWarn = trimmed.startsWith('⚠️') || trimmed.startsWith('❌');
      elements.push(
        <div key={`alert-${i}`} className={`hub-callout-box ${isWarn ? 'warn' : 'success'}`} style={{
          margin: '12px 0',
          padding: '12px 16px',
          borderRadius: '8px',
          background: isWarn ? 'rgba(239, 68, 68, 0.08)' : 'rgba(52, 211, 153, 0.08)',
          border: `1px solid ${isWarn ? 'rgba(239, 68, 68, 0.25)' : 'rgba(52, 211, 153, 0.25)'}`,
          fontSize: '14.5px',
          color: isWarn ? '#fca5a5' : '#a7f3d0',
          lineHeight: 1.65
        }}>
          {parseInlineMarkdown(trimmed, accentColor)}
        </div>
      );
      continue;
    }

    // Bullet point: "- " or "* "
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.substring(2);
      elements.push(
        <div key={`bullet-${i}`} style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          margin: '6px 0',
          paddingLeft: '14px',
          fontSize: '14.5px',
          color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.88))',
          lineHeight: 1.65
        }}>
          <span style={{ color: accentColor, fontWeight: 900, fontSize: '14px', marginTop: '1px' }}>•</span>
          <div style={{ flex: 1 }}>{parseInlineMarkdown(bulletContent, accentColor)}</div>
        </div>
      );
      continue;
    }

    // Default paragraph
    elements.push(
      <p key={`p-${i}`} style={{
        margin: '8px 0',
        fontSize: '15px',
        color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.88))',
        lineHeight: 1.75
      }}>
        {parseInlineMarkdown(trimmed, accentColor)}
      </p>
    );
  }

  return <div>{elements}</div>;
}

// ==========================================
// 4. MAIN COMPONENT EXPORT
// ==========================================

export default function CareerHubPage(): React.JSX.Element {
  const [activeMainTab, setActiveMainTab] = useState<'lessons' | 'mock-interview' | 'interview' | 'interview5120' | 'tips50' | 'battles' | 'cv' | 'probation'>('lessons');

  // Lessons state
  const [selectedModuleId, setSelectedModuleId] = useState<string>('core-java');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('stack-vs-heap');

  // 50 Tips state
  const [tipsCategoryFilter, setTipsCategoryFilter] = useState<string>('All');
  const [tipsSearchQuery, setTipsSearchQuery] = useState<string>('');
  const [expandedTipId, setExpandedTipId] = useState<number | null>(1);

  // Interview state
  const [interviewSearch, setInterviewSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('All');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>('q-1');

  // Battles state
  const [selectedBattleId, setSelectedBattleId] = useState<string>(CODE_BATTLES[0]?.id || '1-bouncer-pattern');
  const [battleCategoryFilter, setBattleCategoryFilter] = useState<string>('All');
  const [battleSearchQuery, setBattleSearchQuery] = useState<string>('');

  const battleCategories = useMemo(() => {
    const cats = Array.from(new Set(CODE_BATTLES.map(b => b.category)));
    return ['All', ...cats];
  }, []);

  const filteredBattles = useMemo(() => {
    return CODE_BATTLES.filter(b => {
      const matchCat = battleCategoryFilter === 'All' || b.category === battleCategoryFilter;
      const q = battleSearchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        b.title.toLowerCase().includes(q) ||
        b.badTitle.toLowerCase().includes(q) ||
        b.goodTitle.toLowerCase().includes(q) ||
        b.impactBadge.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [battleCategoryFilter, battleSearchQuery]);

  const currentBattle = useMemo(() => {
    return CODE_BATTLES.find(b => b.id === selectedBattleId) || filteredBattles[0] || CODE_BATTLES[0];
  }, [selectedBattleId, filteredBattles]);

  const currentBattleIndex = useMemo(() => {
    const idx = CODE_BATTLES.findIndex(b => b.id === currentBattle.id);
    return idx >= 0 ? idx : 0;
  }, [currentBattle]);

  // Snippet Copy State
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const handleCopyCode = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    }
  };

  // Probation checks (localStorage persisted)
  const [checkedProbation, setCheckedProbation] = useState<Record<string, boolean>>({
    'p-1': true,
    'p-2': true,
    'p-3': true
  });

  const filteredTips = useMemo(() => {
    return FIFTY_PRACTICAL_TIPS.filter(tip => {
      const matchCat = tipsCategoryFilter === 'All' || tip.category === tipsCategoryFilter;
      const q = tipsSearchQuery.toLowerCase();
      const matchSearch = tip.title.toLowerCase().includes(q) ||
                          tip.summary.toLowerCase().includes(q) ||
                          tip.detail.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [tipsCategoryFilter, tipsSearchQuery]);

  const filteredInterviewQuestions = useMemo(() => {
    return INTERVIEW_QUESTIONS.filter(q => {
      const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
      const matchLevel = selectedLevelFilter === 'All' || q.level === selectedLevelFilter;
      const s = interviewSearch.toLowerCase();
      const matchSearch = q.question.toLowerCase().includes(s) ||
                          q.shortAnswer.toLowerCase().includes(s) ||
                          q.seniorDeepDive.toLowerCase().includes(s) ||
                          q.trapWarning.toLowerCase().includes(s);
      return matchCat && matchLevel && matchSearch;
    });
  }, [selectedCategory, selectedLevelFilter, interviewSearch]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hub_probation_checklist_v2');
      if (saved) setCheckedProbation(JSON.parse(saved));
    } catch (e) {}

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'mock-interview' || tabParam === 'mock') {
        setActiveMainTab('mock-interview');
      } else if (tabParam === 'interview5120' || tabParam === '5120' || tabParam === '128' || tabParam === 'interview128') {
        setActiveMainTab('interview5120');
      } else if (tabParam === 'lessons' || tabParam === 'interview' || tabParam === 'tips50' || tabParam === 'battles' || tabParam === 'cv' || tabParam === 'probation') {
        setActiveMainTab(tabParam as any);
      }
    }
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedProbation(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('hub_probation_checklist_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const PROBATION_TASKS = [
    // Phase 1: Tuần 1: Onboarding
    { id: 'p-1', phase: 'Tuần 1: Onboarding', text: 'Chạy thành công dự án Local trong 48h đầu (JDK, Maven, Docker DB)', desc: 'Không cần hỏi Senior những lỗi cơ bản đã có trong README.' },
    { id: 'p-2', phase: 'Tuần 1: Onboarding', text: 'Đọc và hiểu luồng kiến trúc nghiệp vụ (Domain & Data Flow)', desc: 'Nắm được luồng request từ Gateway -> Controller -> Service -> DB.' },
    { id: 'p-3', phase: 'Tuần 1: Onboarding', text: 'Nắm vững quy tắc Git branching và commit message của team', desc: 'Quy chuẩn tên branch: feature/JIRA-123-ten-task, atomic commits.' },
    { id: 'p-4', phase: 'Tuần 1: Onboarding', text: 'Chủ động cập nhật lại file README nếu thấy tài liệu cũ bị thiếu', desc: 'Điểm cộng cực lớn giúp bạn ghi điểm chu đáo ngay từ tuần đầu.' },
    { id: 'p-5', phase: 'Tuần 1: Onboarding', text: 'Cấu hình SSH Key, GPG Signing và VPN công ty an toàn trong 24h', desc: 'Đảm bảo môi trường làm việc bảo mật, không commit bằng thông tin cá nhân sai lệch.' },
    { id: 'p-6', phase: 'Tuần 1: Onboarding', text: 'Nắm cấu hình CI/CD Pipeline (GitHub Actions / GitLab CI) & Quality Gate', desc: 'Hiểu các rule Checkstyle, SonarQube và ngưỡng coverage bắt buộc khi merge.' },
    { id: 'p-7', phase: 'Tuần 1: Onboarding', text: 'Tự thiết lập Postman / Swagger Collection để test luồng API chính', desc: 'Lưu trữ các request mẫu kèm token xác thực giúp tăng tốc độ kiểm thử hàng ngày.' },

    // Phase 2: Tuần 2-4: First Tasks & Tiếp Nhận Codebase
    { id: 'p-8', phase: 'Tuần 2-4: First Tasks', text: 'Mở 3 PR gần nhất của Senior để học hỏi Coding Convention', desc: 'Bắt chước cách đặt tên biến, package, xử lý exception và ghi log.' },
    { id: 'p-9', phase: 'Tuần 2-4: First Tasks', text: 'Luôn viết Unit Test đi kèm mọi dòng code mới (Tối thiểu 80% coverage)', desc: 'Không nộp PR thiếu test; test bao phủ cả happy path và error path.' },
    { id: 'p-10', phase: 'Tuần 2-4: First Tasks', text: 'Thái độ cầu thị và lịch sự khi nhận Code Review', desc: 'Không tự ái, cảm ơn khi được góp ý và sửa triệt để trước khi ping lại.' },
    { id: 'p-11', phase: 'Tuần 2-4: First Tasks', text: 'Tự phác thảo tài liệu API Specs (OpenAPI/Swagger) trước khi code', desc: 'Trao đổi và thống nhất hợp đồng API với Frontend trước khi triển khai.' },
    { id: 'p-12', phase: 'Tuần 2-4: First Tasks', text: 'Biết cách đọc và cấu hình Application Profiler & Actuator Metrics', desc: 'Theo dõi chỉ số JVM memory, heap allocation và database query count.' },
    { id: 'p-13', phase: 'Tuần 2-4: First Tasks', text: 'Chạy EXPLAIN kiểm tra hiệu năng câu query SQL trước khi tạo PR', desc: 'Loại bỏ ngay nguy cơ Full Table Scan (type: ALL) và Using filesort.' },
    { id: 'p-14', phase: 'Tuần 2-4: First Tasks', text: 'Nắm vững luồng phân quyền Spring Security & JWT Filters', desc: 'Hiểu cách context SecurityContextHolder trích xuất thông tin người dùng hiện tại.' },
    { id: 'p-15', phase: 'Tuần 2-4: First Tasks', text: 'Phối hợp chặt chẽ với QA/Tester, viết reproduction steps rõ ràng', desc: 'Khi bàn giao tính năng hoặc trao đổi bug, luôn cung cấp đầy đủ payload và curl test.' },

    // Phase 3: Tháng 2: Ownership & Tác Phong Kỹ Sư
    { id: 'p-16', phase: 'Tháng 2: Ownership', text: 'Báo cáo Daily Standup ngắn gọn: Làm gì - Sắp làm gì - Blocker', desc: 'Không nói chung chung "em đang nghiên cứu", nói rõ kết quả và rào cản.' },
    { id: 'p-17', phase: 'Tháng 2: Ownership', text: 'Estimate thời gian có vùng đệm an toàn (Buffer 1.5x)', desc: 'Dự kiến 1 ngày thì estimate 1.5 ngày để dành thời gian viết test và fix bug.' },
    { id: 'p-18', phase: 'Tháng 2: Ownership', text: 'Tự điều tra lỗi 15-30 phút trước khi nhờ Senior trợ giúp', desc: 'Áp dụng quy tắc 4 bước hỏi bài để Senior hỗ trợ nhiệt tình nhất.' },
    { id: 'p-19', phase: 'Tháng 2: Ownership', text: 'Chủ động đề xuất xóa nợ kỹ thuật (Technical Debt) cho module cũ', desc: 'Tái cấu trúc code bẩn, bổ sung unit test cho các đoạn code thiếu test.' },
    { id: 'p-20', phase: 'Tháng 2: Ownership', text: 'Tham gia quan sát và hỗ trợ Incident Response cùng các anh Senior', desc: 'Học cách đọc log phân tán, tra cứu traceId và xử lý khủng hoảng lúc deploy.' },
    { id: 'p-21', phase: 'Tháng 2: Ownership', text: 'Đóng góp ý kiến xây dựng trong buổi Sprint Retrospective', desc: 'Đề xuất cải tiến nhỏ về quy trình hoặc công cụ giúp cả nhóm làm việc mượt mà hơn.' },
    { id: 'p-22', phase: 'Tháng 2: Ownership', text: 'Chuẩn bị bản báo cáo đánh giá thử việc (Probation Presentation) tự tin', desc: 'Tổng kết các đầu việc hoàn thành, chỉ số đo lường và định hướng phát triển quý tiếp theo.' }
  ];

  const completedCount = Object.values(checkedProbation).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / PROBATION_TASKS.length) * 100);

  const activeModule = KNOWLEDGE_MODULES.find(m => m.id === selectedModuleId) || KNOWLEDGE_MODULES[0];
  const activeTopic = activeModule.topics.find(t => t.id === selectedTopicId) || activeModule.topics[0];
  const totalTopicsCount = KNOWLEDGE_MODULES.reduce((acc, m) => acc + m.topics.length, 0);

  return (
    <Layout
      title="Java Career Hub — Cẩm Nang Thực Chiến Fresher / Junior Đi Làm"
      description="Trung tâm huấn luyện kỹ năng thực chiến Backend Java từ docs cho Intern, Fresher và Junior: Tư duy bộ nhớ Stack/Heap, Spring Boot, N+1 Query, Unit Test, Bí kíp viết CV và Phỏng vấn."
    >
      <div
        className="hub-page-container"
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
            <div className="hub-hero-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              <span>🎓 DÀNH CHO INTERN • FRESHER • JUNIOR BACKEND</span>
            </div>

            <h1
              className="hub-hero-title"
              style={{
                fontSize: '2.75rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: '0 auto 14px auto',
                lineHeight: 1.25,
                display: 'block',
                width: 'fit-content',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Java Career Accelerator Hub
            </h1>

            <p
              className="hub-hero-subtitle"
              style={{
                fontSize: '1.18rem',
                color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.82))',
                maxWidth: '860px',
                margin: '0 auto 24px auto',
                lineHeight: 1.7,
                textAlign: 'center',
              }}
            >
              Toàn bộ kiến thức tinh hoa được cô đọng trực tiếp từ kho tài liệu kỹ thuật: <strong>Hiểu bản chất dưới nắp ca-pô</strong>, xóa bỏ thói quen code nghiệp dư ở trường và chuẩn bị hành trang vững chắc để xin việc &amp; pass thử việc.
            </p>

            {/* Quick Metrics */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {[
                { label: `${KNOWLEDGE_MODULES.length} Khối Kiến Thức (${totalTopicsCount} Chuyên Đề)`, desc: 'Java • Spring • JPA • Test • Clean Code • Redis • Kafka • Security • Tải Cao • Entry-Level', color: '#38bdf8' },
                { label: '5,120 Câu Hỏi Thực Chiến', desc: '8 trụ cột công nghệ x 640 câu hỏi chuyên sâu', color: '#8b5cf6' },
                { label: `${FIFTY_PRACTICAL_TIPS.length} Bí Quyết Thực Chiến`, desc: 'Quy tắc vàng sống còn khi đi làm', color: '#ec4899' },
                { label: `${INTERVIEW_QUESTIONS.length} Câu Hỏi "Trúng Tủ"`, desc: 'Bẫy phỏng vấn & Cách trả lời 10 điểm', color: '#fbbf24' },
                { label: 'Checklist 60 Ngày Thử Việc', desc: `Tiến độ: ${progressPercent}% (${completedCount}/${PROBATION_TASKS.length})`, color: '#f97316' }
              ].map((chip, i) => (
                <div key={i} className={`hub-metric-card metric-${i}`} style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '180px'
                }}>
                  <span className="hub-metric-label" style={{ fontWeight: 800 }}>{chip.label}</span>
                  <span className="hub-metric-desc" style={{ fontSize: '12.5px', marginTop: '3px' }}>{chip.desc}</span>
                </div>
              ))}
            </div>

            {/* Unified Career Readiness Meter + Daily 60s Micro-Challenge + Mock Interview CTA */}
            <CareerReadinessAndDailyBanner
              probationPercent={progressPercent}
              onOpenMockInterview={() => {
                setActiveMainTab('mock-interview');
                const navEl = document.getElementById('hub-main-nav');
                if (navEl) navEl.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          {/* ======================================================== */}
          {/* MAIN NAVIGATION BAR */}
          {/* ======================================================== */}
          <div
            id="hub-main-nav"
            className="hub-main-nav"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '32px',
              paddingBottom: '16px'
            }}
          >
            {[
              { id: 'lessons', label: '📘 Kho Tri Thức Thực Chiến', color: '#38bdf8' },
              { id: 'mock-interview', label: '🎙️ Phỏng Vấn Thử (AI Evaluator)', color: '#0ea5e9' },
              { id: 'interview5120', label: '🧠 128 Câu Hỏi Thực Chiến', color: '#8b5cf6' },
              { id: 'interview', label: `🎯 Phỏng Vấn "Trúng Tủ" (${INTERVIEW_QUESTIONS.length})`, color: '#34d399' },
              { id: 'tips50', label: `⚡ ${FIFTY_PRACTICAL_TIPS.length} Bí Quyết Đi Làm`, color: '#ec4899' },
              { id: 'battles', label: `⚔️ So Kèo Code (${CODE_BATTLES.length} Trận)`, color: '#fbbf24' },
              { id: 'cv', label: `📄 Bác Sĩ Sửa CV & Khung Lương`, color: '#a78bfa' },
              { id: 'probation', label: `📋 Checklist Thử Việc (${progressPercent}%)`, color: '#f97316' }
            ].map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`hub-main-nav-tab tab-${tab.id} ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: KHO TRI THỨC THỰC CHIẾN (DEEP LESSONS) */}
          {/* ======================================================== */}
          {activeMainTab === 'lessons' && (() => {
            const currentTopicIndex = activeModule.topics.findIndex(t => t.id === activeTopic.id);
            const prevTopic = currentTopicIndex > 0 ? activeModule.topics[currentTopicIndex - 1] : null;
            const nextTopic = currentTopicIndex < activeModule.topics.length - 1 ? activeModule.topics[currentTopicIndex + 1] : null;
            const currentModIndex = KNOWLEDGE_MODULES.findIndex(m => m.id === activeModule.id);
            const nextModule = currentModIndex < KNOWLEDGE_MODULES.length - 1 ? KNOWLEDGE_MODULES[currentModIndex + 1] : null;

            return (
              <div>
                {/* 1. Module Selector: Modern 9-Card Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {KNOWLEDGE_MODULES.map((mod, idx) => {
                    const isSelected = selectedModuleId === mod.id;
                    const modNum = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        key={mod.id}
                        className={`hub-module-card mod-${mod.id} ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setSelectedTopicId(mod.topics[0].id);
                        }}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: `1.5px solid ${isSelected ? mod.accentColor : 'rgba(255, 255, 255, 0.08)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: isSelected ? `0 0 20px ${mod.accentColor}30` : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${mod.accentColor}, transparent)`
                          }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '24px' }}>{mod.icon}</span>
                          <span
                            className="hub-module-badge"
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: isSelected ? mod.accentColor : 'rgba(255, 255, 255, 0.07)',
                              color: isSelected ? '#000000' : 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.65))'
                            }}
                          >
                            #{modNum} • {mod.topics.length} bài
                          </span>
                        </div>
                        <div
                          className="hub-module-title"
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: isSelected ? 'var(--ifm-color-content, #ffffff)' : 'var(--ifm-color-content, rgba(255, 255, 255, 0.85))',
                            lineHeight: 1.35,
                            marginBottom: '4px'
                          }}
                        >
                          {mod.title}
                        </div>
                        <div
                          className="hub-module-tagline"
                          style={{
                            fontSize: '12px',
                            color: isSelected ? mod.accentColor : 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.5))',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {mod.tagline}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Active Module Hero Strip */}
                <div
                  className="hub-active-mod-strip"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: `1px solid ${activeModule.accentColor}35`,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '28px',
                      background: `${activeModule.accentColor}22`,
                      padding: '8px',
                      borderRadius: '10px',
                      display: 'inline-flex'
                    }}>
                      {activeModule.icon}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ifm-color-content, #ffffff)' }}>
                          {activeModule.title}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: `${activeModule.accentColor}25`,
                          color: activeModule.accentColor
                        }}>
                          MODULE #{String(currentModIndex + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.7))', marginTop: '2px' }}>
                        {activeModule.tagline}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.7))'
                  }}>
                    <span>Đang xem bài: <strong style={{ color: activeModule.accentColor }}>{currentTopicIndex + 1}</strong> / {activeModule.topics.length}</span>
                    <div style={{
                      width: '80px',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((currentTopicIndex + 1) / activeModule.topics.length) * 100}%`,
                        height: '100%',
                        background: activeModule.accentColor,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* 3. Split Layout: Left Topic Index vs Right Deep-Dive Reader */}
                <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: '20px', alignItems: 'start' }}>
                  <style>{`
                    @media (max-width: 900px) {
                      div[style*="gridTemplateColumns: 310px 1fr"] {
                        grid-template-columns: 1fr !important;
                      }
                    }
                  `}</style>

                  {/* Left Column: Topic Index Pills */}
                  <div
                    className="hub-topic-index-pane"
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '14px',
                      position: 'sticky',
                      top: '20px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px 12px 6px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.6))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📑 Danh Sách Chuyên Đề
                      </span>
                      <span style={{ fontSize: '11px', color: activeModule.accentColor, fontWeight: 700 }}>
                        {activeModule.topics.length} bài học
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeModule.topics.map((t, idx) => {
                        const isTopicSelected = selectedTopicId === t.id;
                        const topicNum = String(idx + 1).padStart(2, '0');
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className={`hub-topic-item ${isTopicSelected ? 'selected' : ''}`}
                            style={{
                              padding: '11px 13px',
                              borderRadius: '10px',
                              background: isTopicSelected
                                ? `linear-gradient(90deg, ${activeModule.accentColor}25 0%, rgba(255, 255, 255, 0.02) 100%)`
                                : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isTopicSelected ? activeModule.accentColor : 'rgba(255, 255, 255, 0.05)'}`,
                              borderLeft: isTopicSelected ? `4px solid ${activeModule.accentColor}` : undefined,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '5px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: isTopicSelected ? activeModule.accentColor : 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.45))'
                              }}>
                                #{topicNum}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isTopicSelected ? `${activeModule.accentColor}30` : 'rgba(255, 255, 255, 0.05)',
                                color: isTopicSelected ? activeModule.accentColor : 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.55))'
                              }}>
                                {t.badge}
                              </span>
                            </div>
                            <div
                              className="hub-topic-item-title"
                              style={{
                                fontSize: '13.5px',
                                fontWeight: isTopicSelected ? 800 : 600,
                                color: isTopicSelected ? 'var(--ifm-color-content, #ffffff)' : 'var(--ifm-color-content, rgba(255, 255, 255, 0.8))',
                                lineHeight: 1.35
                              }}
                            >
                              {t.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Deep-Dive Document Reader */}
                  <div
                    className="hub-reader-card"
                    style={{
                      background: 'rgba(13, 17, 23, 0.85)',
                      border: `1px solid ${activeModule.accentColor}35`,
                      borderRadius: '16px',
                      padding: '30px 32px',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {/* Breadcrumbs Tag */}
                    <div
                      className="hub-reader-breadcrumbs"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.5))',
                        marginBottom: '14px'
                      }}
                    >
                      <span>Kho Tri Thức</span>
                      <span>/</span>
                      <span style={{ color: activeModule.accentColor }}>{activeModule.title}</span>
                      <span>/</span>
                      <span style={{ color: 'var(--ifm-color-content, #ffffff)' }}>Bài #{String(currentTopicIndex + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Topic Header Block */}
                    <div style={{ marginBottom: '22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: activeModule.accentColor,
                          color: '#000000'
                        }}>
                          {activeTopic.badge}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.75))'
                        }}>
                          ⏱️ 5 phút đọc chuyên sâu
                        </span>
                      </div>

                      <h1
                        className="hub-reader-title"
                        style={{
                          margin: '8px 0 14px 0',
                          fontSize: '1.95rem',
                          fontWeight: 900,
                          color: 'var(--ifm-color-content, #ffffff)',
                          lineHeight: 1.3
                        }}
                      >
                        {activeTopic.title}
                      </h1>

                      {/* TL;DR Executive Takeaway Box */}
                      <div className="hub-takeaway-box" style={{
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '20px', marginTop: '-2px' }}>⚡</span>
                        <div style={{ fontSize: '14.5px', color: '#a7f3d0', fontWeight: 600, lineHeight: 1.6 }}>
                          <strong>Tóm tắt cốt lõi:</strong> {activeTopic.summary}
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Detailed Explanation (Formatted) */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: activeModule.accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>📖</span>
                        <span>Phân Tích Bản Chất Dưới Nắp Ca-pô:</span>
                      </div>

                      <FormattedDocContent
                        text={activeTopic.explanation}
                        accentColor={activeModule.accentColor}
                      />
                    </div>

                    {/* Section 2: ASCII Architecture Diagram (If Present) */}
                    {activeTopic.asciiDiagram && (
                      <div style={{
                        marginBottom: '28px',
                        background: '#050a14',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                      }}>
                        {/* Terminal Header */}
                        <div style={{
                          padding: '10px 16px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginLeft: '6px' }}>
                              📊 SƠ ĐỒ CƠ CHẾ BỘ NHỚ / KIẾN TRÚC HỆ THỐNG
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(activeTopic.asciiDiagram || '', `diag-${activeTopic.id}`)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: copiedSnippetId === `diag-${activeTopic.id}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                              border: `1px solid ${copiedSnippetId === `diag-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                              color: copiedSnippetId === `diag-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {copiedSnippetId === `diag-${activeTopic.id}` ? '✓ Đã chép' : '📋 Copy Sơ Đồ'}
                          </button>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '18px 20px',
                          fontSize: '13px',
                          color: '#38bdf8',
                          background: 'transparent',
                          overflowX: 'auto',
                          lineHeight: 1.5,
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                        }}>
                          {activeTopic.asciiDiagram}
                        </pre>
                      </div>
                    )}

                    {/* Section 3: Side-by-Side Code Comparison */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.85))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>⚔️</span>
                        <span>Đối Chiếu Thực Chiến: Nghiệp Dư vs Chuẩn Doanh Nghiệp:</span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '16px'
                      }}>
                        {/* Bad Code Box */}
                        {activeTopic.badCode && (
                          <div className="hub-code-bad-box" style={{
                            background: 'rgba(248, 113, 113, 0.03)',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            borderRadius: '12px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              padding: '10px 14px',
                              background: 'rgba(248, 113, 113, 0.12)',
                              borderBottom: '1px solid rgba(248, 113, 113, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>
                                  {activeTopic.badCodeTitle || '❌ Cách Làm Nghiệp Dư / Code Mùi'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopyCode(activeTopic.badCode || '', `bad-${activeTopic.id}`)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  background: copiedSnippetId === `bad-${activeTopic.id}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                  border: `1px solid ${copiedSnippetId === `bad-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                                  color: copiedSnippetId === `bad-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedSnippetId === `bad-${activeTopic.id}` ? '✓ Đã chép' : '📋 Copy'}
                              </button>
                            </div>
                            <pre style={{
                              margin: 0,
                              padding: '14px 16px',
                              fontSize: '13px',
                              background: 'transparent',
                              color: '#fca5a5',
                              overflowX: 'auto',
                              lineHeight: 1.55,
                              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                            }}>
                              <code>{activeTopic.badCode}</code>
                            </pre>
                          </div>
                        )}

                        {/* Good Code Box */}
                        <div className="hub-code-good-box" style={{
                          background: 'rgba(52, 211, 153, 0.03)',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '10px 14px',
                            background: 'rgba(52, 211, 153, 0.12)',
                            borderBottom: '1px solid rgba(52, 211, 153, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                                {activeTopic.goodCodeTitle}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyCode(activeTopic.goodCode, `good-${activeTopic.id}`)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                background: copiedSnippetId === `good-${activeTopic.id}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                border: `1px solid ${copiedSnippetId === `good-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                                color: copiedSnippetId === `good-${activeTopic.id}` ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              {copiedSnippetId === `good-${activeTopic.id}` ? '✓ Đã chép' : '📋 Copy'}
                            </button>
                          </div>
                          <pre style={{
                            margin: 0,
                            padding: '14px 16px',
                            fontSize: '13px',
                            background: 'transparent',
                            color: '#a7f3d0',
                            overflowX: 'auto',
                            lineHeight: 1.55,
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                          }}>
                            <code>{activeTopic.goodCode}</code>
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Interview Gold Tip */}
                    <div className="hub-interview-gold-tip" style={{
                      marginBottom: '32px',
                      padding: '18px 22px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.04) 100%)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      boxShadow: '0 4px 20px rgba(251, 191, 36, 0.08)'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#fbbf24',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>🏆</span>
                        <span>BẪY PHỎNG VẤN & CÁCH TRẢ LỜI ĐIỂM 10:</span>
                      </div>
                      <div style={{ fontSize: '14.5px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.92))', lineHeight: 1.75 }}>
                        {parseInlineMarkdown(activeTopic.interviewTip, '#fbbf24')}
                      </div>
                    </div>

                    {/* Section 5: Pagination Bottom Navigation */}
                    <div style={{
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      {prevTopic ? (
                        <button
                          onClick={() => {
                            setSelectedTopicId(prevTopic.id);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="hub-reader-nav-btn hub-reader-prev-btn"
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'var(--ifm-color-content, #ffffff)',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>⬅️</span>
                          <span>Bài trước: {prevTopic.title.length > 25 ? prevTopic.title.substring(0, 25) + '...' : prevTopic.title}</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {nextTopic ? (
                        <button
                          onClick={() => {
                            setSelectedTopicId(nextTopic.id);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="hub-reader-nav-btn hub-reader-next-btn"
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${activeModule.accentColor} 0%, #34d399 100%)`,
                            border: 'none',
                            color: '#000000',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 15px ${activeModule.accentColor}40`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>Bài tiếp: {nextTopic.title.length > 25 ? nextTopic.title.substring(0, 25) + '...' : nextTopic.title}</span>
                          <span>➡️</span>
                        </button>
                      ) : nextModule ? (
                        <button
                          onClick={() => {
                            setSelectedModuleId(nextModule.id);
                            setSelectedTopicId(nextModule.topics[0].id);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="hub-reader-nav-btn hub-reader-next-btn"
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${nextModule.accentColor} 0%, #38bdf8 100%)`,
                            border: 'none',
                            color: '#000000',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 15px ${nextModule.accentColor}40`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>Hoàn thành module! Sang {nextModule.title}</span>
                          <span>🚀</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* TAB: PHÒNG PHỎNG VẤN THỬ (MOCK INTERVIEW STUDIO) */}
          {/* ======================================================== */}
          {activeMainTab === 'mock-interview' && (
            <div style={{ marginTop: '8px' }}>
              <MockInterviewStudio onSwitchTab={(tab) => setActiveMainTab(tab as any)} />
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: 5,120 CÂU HỎI PHỎNG VẤN THỰC CHIẾN */}
          {/* ======================================================== */}
          {activeMainTab === 'interview5120' && (
            <div style={{ marginTop: '8px' }}>
              <SeniorInterview5120Suite />
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: 50 BÍ QUYẾT ĐI LÀM THỰC CHIẾN */}
          {/* ======================================================== */}
          {activeMainTab === 'tips50' && (
            <div>
              {/* Category Filter & Search Bar */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'Core Java & JVM', 'Spring Boot & REST', 'Database & JPA', 'Testing & QA', 'Clean Code & Logging', 'Git & Tác Phong', 'Hạ Tầng & Security', 'Hệ Thống & Tải Cao'].map(cat => {
                    const isActive = tipsCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setTipsCategoryFilter(cat)}
                        className={`hub-filter-btn ${isActive ? 'active' : ''}`}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          background: isActive ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isActive ? '#ec4899' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: isActive ? '#db2777' : 'var(--ifm-color-content-secondary, #334155)',
                          fontSize: '13.5px',
                          fontWeight: isActive ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {cat === 'All' ? `Tất cả (${FIFTY_PRACTICAL_TIPS.length})` : cat}
                      </button>
                    );
                  })}
                </div>

                <div style={{ minWidth: '280px', flex: '1 1 auto', maxWidth: '420px' }}>
                  <input
                    type="text"
                    className="hub-search-input"
                    placeholder={`Tìm nhanh trong ${FIFTY_PRACTICAL_TIPS.length} mẹo (vd: N+1, Lua, Deadlock, Idempotent, DLX)...`}
                    value={tipsSearchQuery}
                    onChange={(e) => setTipsSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'var(--ifm-color-content, #ffffff)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Tips Stats Bar */}
              <div style={{
                marginBottom: '18px',
                fontSize: '14px',
                color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.75))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span>
                  Đang hiển thị <strong>{filteredTips.length}</strong> / 50 bí quyết vàng
                </span>
                <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: 600 }}>
                  ⚡ Click vào từng thẻ để xem chi tiết & code mẫu
                </span>
              </div>

              {/* Tips List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTips.map((tip) => {
                  const isExpanded = expandedTipId === tip.id;
                  const priorityColor =
                    tip.priority === 'Bắt Buộc' ? '#ef4444' :
                    tip.priority === 'Hiệu Năng' ? '#38bdf8' :
                    tip.priority === 'Kiến Trúc' ? '#a855f7' : '#10b981';

                  return (
                    <div
                      key={tip.id}
                      className={`hub-tip-card ${isExpanded ? 'expanded' : ''}`}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${isExpanded ? '#ec4899' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        boxShadow: isExpanded ? '0 4px 20px rgba(236, 72, 153, 0.15)' : 'none'
                      }}
                    >
                      {/* Header Row */}
                      <div
                        onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                        style={{
                          padding: '15px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(236, 72, 153, 0.08)' : 'transparent',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: 'var(--ifm-color-content, #ffffff)'
                          }}>
                            {tip.id}
                          </span>

                          <span
                            className="hub-tip-cat-badge"
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.8))'
                            }}
                          >
                            {tip.category}
                          </span>

                          <span
                            className={`hub-tip-priority-badge priority-${tip.priority === 'Bắt Buộc' ? 'mandatory' : tip.priority === 'Hiệu Năng' ? 'performance' : 'architecture'}`}
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: `${priorityColor}22`,
                              color: priorityColor,
                              border: `1px solid ${priorityColor}44`
                            }}
                          >
                            {tip.priority}
                          </span>

                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ifm-color-content, #ffffff)' }}>
                            {tip.title}
                          </span>
                        </div>

                        <span style={{ color: '#ec4899', fontSize: '20px', fontWeight: 800, flexShrink: 0 }}>
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>

                      {/* Expandable Body */}
                      {isExpanded && (
                        <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          {/* Summary Banner */}
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: 'rgba(236, 72, 153, 0.06)',
                            border: '1px solid rgba(236, 72, 153, 0.25)',
                            fontSize: '14.5px',
                            color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.95))',
                            lineHeight: 1.6,
                            marginBottom: '14px'
                          }}>
                            ⚡ <strong>Bản chất vấn đề:</strong> {tip.summary}
                          </div>

                          {/* Detail Explanation */}
                          <div style={{
                            fontSize: '15px',
                            color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.88))',
                            lineHeight: 1.75,
                            marginBottom: (tip.codeBad || tip.codeGood) ? '16px' : '0'
                          }}>
                            {tip.detail}
                          </div>

                          {/* Code Comparison (if available) */}
                          {(tip.codeBad || tip.codeGood) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                              {tip.codeBad && (
                                <div
                                  className="hub-tip-code-bad"
                                  style={{
                                    background: 'rgba(248, 113, 113, 0.05)',
                                    border: '1px solid rgba(248, 113, 113, 0.25)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div
                                    className="hub-tip-code-bad-header"
                                    style={{ background: 'rgba(248, 113, 113, 0.15)', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#f87171' }}
                                  >
                                    ❌ Sai lầm thường gặp
                                  </div>
                                  <pre style={{ margin: 0, padding: '12px', fontSize: '13px', background: 'transparent', color: '#fca5a5', overflowX: 'auto', lineHeight: 1.5 }}>
                                    <code>{tip.codeBad}</code>
                                  </pre>
                                </div>
                              )}

                              {tip.codeGood && (
                                <div
                                  className="hub-tip-code-good"
                                  style={{
                                    background: 'rgba(52, 211, 153, 0.05)',
                                    border: '1px solid rgba(52, 211, 153, 0.25)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div
                                    className="hub-tip-code-good-header"
                                    style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#34d399' }}
                                  >
                                    ✅ Chuẩn đi làm (Best Practice)
                                  </div>
                                  <pre style={{ margin: 0, padding: '12px', fontSize: '13px', background: 'transparent', color: '#a7f3d0', overflowX: 'auto', lineHeight: 1.5 }}>
                                    <code>{tip.codeGood}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PHỎNG VẤN TRÚNG TỦ */}
          {/* ======================================================== */}
          {activeMainTab === 'interview' && (
            <div>
              {/* Filter and Search Bar */}
              <div
                className="hub-interview-filter-card"
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '22px'
                }}
              >
                {/* Search Bar & Stats */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className="hub-count-badge"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399',
                        fontSize: '13.5px',
                        fontWeight: 800
                      }}
                    >
                      🎯 Đang hiển thị {filteredInterviewQuestions.length} / {INTERVIEW_QUESTIONS.length} câu hỏi
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.65))' }}>
                      (Phân loại theo mức độ và chủ đề)
                    </span>
                  </div>

                  <div style={{ minWidth: '280px', flex: '1 1 auto', maxWidth: '420px' }}>
                    <input
                      type="text"
                      className="hub-search-input"
                      placeholder="Tìm câu hỏi, từ khóa, bẫy phỏng vấn..."
                      value={interviewSearch}
                      onChange={(e) => setInterviewSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'var(--ifm-color-content, #ffffff)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Level Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.6))', marginRight: '4px' }}>
                    Cấp Độ:
                  </span>
                  {[
                    { id: 'All', label: 'Tất cả Level' },
                    { id: 'Intern', label: '🌱 Intern (Thực tập sinh)' },
                    { id: 'Fresher', label: '🚀 Fresher (Mới ra trường)' },
                    { id: 'Junior', label: '⚡ Junior (1-2 năm kn)' }
                  ].map(lvl => {
                    const isActive = selectedLevelFilter === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => setSelectedLevelFilter(lvl.id)}
                        className={`hub-filter-btn ${isActive ? 'active' : ''}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: isActive ? '#0284c7' : 'var(--ifm-color-content-secondary, #334155)',
                          fontSize: '13px',
                          fontWeight: isActive ? 800 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>

                {/* Category Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.6))', marginRight: '4px' }}>
                    Chủ Đề:
                  </span>
                  {[
                    'All',
                    'Core Java',
                    'Spring Boot',
                    'Database / JPA',
                    'Concurrency & JVM',
                    'Testing & QA',
                    'Hạ Tầng & Security',
                    'Hệ Thống & Tải Cao',
                    'Kỹ Năng & Live Coding'
                  ].map(cat => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`hub-filter-btn ${isActive ? 'active' : ''}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: isActive ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isActive ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: isActive ? '#059669' : 'var(--ifm-color-content-secondary, #334155)',
                          fontSize: '13px',
                          fontWeight: isActive ? 800 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat === 'All' ? 'Tất cả chủ đề' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Flashcards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredInterviewQuestions.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '10px',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.7))',
                    fontSize: '14.5px'
                  }}>
                    🔍 Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại. Thử chọn "Tất cả" hoặc nhập từ khóa khác!
                  </div>
                ) : (
                  filteredInterviewQuestions.map((q) => {
                    const isExpanded = expandedQuestionId === q.id;
                    const levelBadgeColor = q.level === 'Intern' ? '#34d399' :
                                           q.level === 'Fresher' ? '#38bdf8' : '#a78bfa';
                    const catBadgeColor = q.category === 'Core Java' ? '#38bdf8' :
                                         q.category === 'Spring Boot' ? '#fbbf24' :
                                         q.category === 'Database / JPA' ? '#f97316' :
                                         q.category === 'Concurrency & JVM' ? '#ec4899' :
                                         q.category === 'Testing & QA' ? '#2dd4bf' :
                                         q.category === 'Hạ Tầng & Security' ? '#eab308' : '#34d399';

                    return (
                      <div
                        key={q.id}
                        className={`hub-question-card ${isExpanded ? 'expanded' : ''}`}
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: `1px solid ${isExpanded ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          style={{
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(52, 211, 153, 0.08)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, marginRight: '16px' }}>
                            <span
                              className={`hub-level-badge level-${q.level.toLowerCase()}`}
                              style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '4px',
                                background: `${levelBadgeColor}20`,
                                border: `1px solid ${levelBadgeColor}50`,
                                color: levelBadgeColor,
                                textTransform: 'uppercase'
                              }}
                            >
                              {q.level}
                            </span>

                            <span
                              className="hub-cat-badge"
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '4px',
                                background: `${catBadgeColor}15`,
                                border: `1px solid ${catBadgeColor}35`,
                                color: catBadgeColor
                              }}
                            >
                              {q.category}
                            </span>

                            <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ifm-color-content, #ffffff)', lineHeight: 1.45 }}>
                              {q.question}
                            </span>
                          </div>

                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isExpanded ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isExpanded ? '#34d399' : 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.6))',
                            fontSize: '18px',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {isExpanded ? '−' : '+'}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🎯</span> Câu trả lời 30 giây (Elevator Pitch)
                              </div>
                              <div style={{ fontSize: '15px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.92))', lineHeight: 1.7 }}>
                                {q.shortAnswer}
                              </div>
                            </div>

                            <div style={{
                              padding: '14px 16px',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.06)',
                              border: '1px solid rgba(56, 189, 248, 0.2)',
                              marginBottom: '12px'
                            }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🧠</span> Dưới nắp ca-pô (Senior Deep Dive)
                              </div>
                              <div style={{ fontSize: '14.5px', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.88))', lineHeight: 1.7 }}>
                                {q.seniorDeepDive}
                              </div>
                            </div>

                            <div
                              className="hub-question-trap-box"
                              style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                background: 'rgba(248, 113, 113, 0.08)',
                                border: '1px solid rgba(248, 113, 113, 0.25)'
                              }}
                            >
                              <div
                                className="hub-question-trap-title"
                                style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <span>⚠️</span> Bẫy phỏng vấn viên sẽ hỏi tiếp
                              </div>
                              <div
                                className="hub-question-trap-content"
                                style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.6 }}
                              >
                                {q.trapWarning}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TRƯỜNG HỌC VS ĐI LÀM (CODE BATTLES) */}
          {/* ======================================================== */}
          {activeMainTab === 'battles' && (
            <div>
              <div
                className="hub-battle-container"
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '22px',
                  marginBottom: '22px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚔️</span> Trường Học vs Đi Làm: {CODE_BATTLES.length} Trận So Kèo Code Thực Chiến
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.75))' }}>
                      So sánh trực quan giữa thói quen viết code sinh viên/lý thuyết và tiêu chuẩn Production của doanh nghiệp qua 10 chủ đề chuyên sâu.
                    </p>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    color: '#fbbf24',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    Trận {currentBattleIndex + 1} / {CODE_BATTLES.length}
                  </span>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  {/* Search input */}
                  <div style={{ flex: '1 1 260px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="🔍 Tìm kiếm trong 100 trận so kèo (tên, từ khóa, tác động)..."
                      value={battleSearchQuery}
                      onChange={(e) => setBattleSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: 'var(--ifm-color-content, #ffffff)',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
                  {battleCategories.map((cat) => {
                    const isActive = battleCategoryFilter === cat;
                    const count = cat === 'All'
                      ? CODE_BATTLES.length
                      : CODE_BATTLES.filter(b => b.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setBattleCategoryFilter(cat)}
                        className={`hub-filter-btn ${isActive ? 'active' : ''}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          background: isActive ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: isActive ? '#d97706' : 'var(--ifm-color-content-secondary, #334155)',
                          fontWeight: isActive ? 800 : 500,
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat === 'All' ? '🌟 Tất Cả' : cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Battle Switcher */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  maxHeight: '130px',
                  flexWrap: 'wrap'
                }}>
                  {filteredBattles.map((battle) => {
                    const isActive = currentBattle.id === battle.id;
                    return (
                      <button
                        key={battle.id}
                        onClick={() => setSelectedBattleId(battle.id)}
                        className={`hub-filter-btn ${isActive ? 'active' : ''}`}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: isActive ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: isActive ? '#d97706' : 'var(--ifm-color-content-secondary, #334155)',
                          fontWeight: isActive ? 800 : 500,
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {battle.title}
                      </button>
                    );
                  })}
                  {filteredBattles.length === 0 && (
                    <div style={{ padding: '12px', fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, #94a3b8)' }}>
                      Không tìm thấy trận so kèo nào phù hợp với từ khóa "{battleSearchQuery}".
                    </div>
                  )}
                </div>
              </div>

              {/* Current Battle Details Header */}
              <div>
                <div
                  className="hub-battle-header"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontSize: '12.5px',
                      fontWeight: 800
                    }}>
                      {currentBattle.category}
                    </span>
                    <span
                      className="hub-battle-title"
                      style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ifm-color-content, #ffffff)' }}
                    >
                      {currentBattle.title}
                    </span>
                  </div>

                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34d399',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    ⚡ Tác động: {currentBattle.impactBadge}
                  </span>
                </div>

                {/* Battle Side-by-Side Showcase */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '18px' }}>
                  {/* Left: Bad Code */}
                  <div className="hub-code-bad-box" style={{
                    background: 'rgba(248, 113, 113, 0.04)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(248, 113, 113, 0.15)', padding: '11px 16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>
                        {currentBattle.badTitle}
                      </span>
                      <button
                        onClick={() => handleCopyCode(currentBattle.badCode, `bad-${currentBattle.id}`)}
                        style={{
                          background: 'rgba(248, 113, 113, 0.2)',
                          border: '1px solid rgba(248, 113, 113, 0.4)',
                          color: '#f87171',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedSnippetId === `bad-${currentBattle.id}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: '16px', fontSize: '13.5px', lineHeight: 1.6, background: 'transparent', color: '#fca5a5', overflowX: 'auto', flex: 1 }}>
                      <code>{currentBattle.badCode}</code>
                    </pre>
                    <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(248, 113, 113, 0.2)', fontSize: '13.5px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.82))', lineHeight: 1.6 }}>
                      <strong style={{ color: '#f87171' }}>Hậu quả: </strong>{currentBattle.badExplanation}
                    </div>
                  </div>

                  {/* Right: Good Code */}
                  <div className="hub-code-good-box" style={{
                    background: 'rgba(52, 211, 153, 0.04)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(52, 211, 153, 0.15)', padding: '11px 16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                        {currentBattle.goodTitle}
                      </span>
                      <button
                        onClick={() => handleCopyCode(currentBattle.goodCode, `good-${currentBattle.id}`)}
                        style={{
                          background: 'rgba(52, 211, 153, 0.2)',
                          border: '1px solid rgba(52, 211, 153, 0.4)',
                          color: '#34d399',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedSnippetId === `good-${currentBattle.id}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: '16px', fontSize: '13.5px', lineHeight: 1.6, background: 'transparent', color: '#a7f3d0', overflowX: 'auto', flex: 1 }}>
                      <code>{currentBattle.goodCode}</code>
                    </pre>
                    <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(52, 211, 153, 0.2)', fontSize: '13.5px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.82))', lineHeight: 1.6 }}>
                      <strong style={{ color: '#34d399' }}>Lợi ích Production: </strong>{currentBattle.goodExplanation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Incident War Room (2 AM On-Call Simulator) */}
              <div style={{ marginTop: '24px' }}>
                <IncidentWarRoomSection />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: BÁC SĨ SỬA CV & KHUNG LƯƠNG BACKEND */}
          {/* ======================================================== */}
          {activeMainTab === 'cv' && (
            <div>
              {/* Interactive CV Doctor (Google XYZ) & Salary Explorer */}
              <CvDoctorAndSalarySection />

              <div
                className="hub-cv-container"
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '26px',
                  marginBottom: '22px'
                }}
              >
                <h2 style={{ margin: '0 0 14px 0', fontSize: '1.6rem', color: '#a78bfa' }}>
                  📄 4 Tiêu Chuẩn Vàng Viết CV Cho Fresher / Junior
                </h2>
                <p style={{ margin: '0 0 22px 0', fontSize: '15px', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.82))', lineHeight: 1.75 }}>
                  Technical Recruiter và Tech Lead chỉ dành trung bình <strong>6 giây</strong> để lướt qua một chiếc CV. Dưới đây là cách biến CV của bạn thành thỏi nam châm hút lịch phỏng vấn:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {CV_SECTIONS.map((sec, idx) => (
                    <div
                      key={idx}
                      className="hub-cv-card"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '18px'
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
                        {sec.sectionTitle}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                            ✅ NÊN LÀM
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.88))', lineHeight: 1.7 }}>
                            {sec.doThis.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>

                        <div style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                            ❌ TUYỆT ĐỐI TRÁNH
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px', color: 'var(--ifm-color-content, rgba(255, 255, 255, 0.88))', lineHeight: 1.7 }}>
                            {sec.dontDoThis.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div
                        className="hub-cv-example-box"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '13.5px',
                          color: '#a7f3d0',
                          lineHeight: 1.6
                        }}
                      >
                        {sec.exampleText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CHECKLIST 60 NGÀY THỬ VIỆC */}
          {/* ======================================================== */}
          {activeMainTab === 'probation' && (
            <div>
              {/* Progress Bar */}
              <div
                className="hub-probation-container"
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '22px',
                  marginBottom: '22px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--ifm-color-content, #ffffff)' }}>
                    Tiến Độ Sẵn Sàng Vượt Qua 2 Tháng Thử Việc (Probation Survival Tracker)
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: progressPercent >= 70 ? '#34d399' : '#fbbf24' }}>
                    {completedCount} / {PROBATION_TASKS.length} ({progressPercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: progressPercent >= 70 ? 'linear-gradient(90deg, #34d399, #38bdf8)' : 'linear-gradient(90deg, #fbbf24, #f97316)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PROBATION_TASKS.map((t) => {
                  const isChecked = !!checkedProbation[t.id];
                  return (
                    <div
                      key={t.id}
                      className={`hub-checklist-task-card ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleCheck(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isChecked ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#34d399', width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: t.phase.includes('Tuần 1') ? 'rgba(56, 189, 248, 0.2)' :
                                        t.phase.includes('Tuần 2-4') ? 'rgba(251, 191, 36, 0.2)' : 'rgba(167, 139, 250, 0.2)',
                            color: t.phase.includes('Tuần 1') ? '#38bdf8' :
                                   t.phase.includes('Tuần 2-4') ? '#fbbf24' : '#a78bfa'
                          }}>
                            {t.phase}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: isChecked ? '#34d399' : 'var(--ifm-color-content, #ffffff)' }}>
                            {t.text}
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.72))', lineHeight: 1.55 }}>
                          {t.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FOOTER CALLOUT BANNER */}
          {/* ======================================================== */}
          <div className="hub-footer-callout" style={{
            marginTop: '44px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '28px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.45rem', color: 'var(--ifm-color-content, #ffffff)' }}>
              Kiến thức vững vàng — Tự tin bước vào dự án thực tế
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--ifm-color-content-secondary, rgba(255, 255, 255, 0.8))', maxWidth: '720px', marginInline: 'auto', lineHeight: 1.7 }}>
              Hãy đào sâu từng chủ đề, viết code mẫu và chạy thử nghiệm trên máy của bạn. Chúc bạn sớm nhận được Offer và vượt qua thử việc xuất sắc!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                to="/technical-knowledge/java/java-overview"
                style={{
                  background: '#38bdf8',
                  color: '#000000',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '14.5px',
                  textDecoration: 'none'
                }}
              >
                Khám Phá Toàn Bộ Java Docs →
              </Link>
              <Link
                to="/arcade"
                className="hub-arcade-link-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--ifm-color-content, #ffffff)',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  textDecoration: 'none'
                }}
              >
                Luyện Tập Tại Arcade 🕹️
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
