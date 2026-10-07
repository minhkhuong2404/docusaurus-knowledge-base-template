import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import MockInterviewStudio from '../../components/mock-interview/MockInterviewStudio';

export default function MockInterviewPage(): React.JSX.Element {
  return (
    <Layout
      title="Mock Interview Studio — Phỏng Vấn Thử Java Backend Entry-Level"
      description="Luyện tập phỏng vấn thử bằng tiếng Việt với AI Evaluator, bốc đề ngẫu nhiên từ Java Core, Spring Boot, Database, Network."
    >
      <div
        className="mock-interview-page-wrapper"
        style={{
          minHeight: '100vh',
          background: 'var(--page-bg, #090d16)',
          padding: '36px 16px 80px 16px',
          color: 'var(--ifm-color-content, #ffffff)',
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          {/* Integration Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(52, 211, 153, 0.12) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <span style={{ fontSize: '13.5px', color: 'var(--ifm-color-content, #0f172a)' }}>
                Tính năng này đã được tích hợp trực tiếp vào <strong>Career Hub</strong>! Bạn có thể luyện tập ngay tại đây hoặc trong tab Phỏng Vấn Thử của Career Hub.
              </span>
            </div>
            <Link
              to="/hub?tab=mock-interview"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#0284c7',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Mở trong Career Hub ➔
            </Link>
          </div>

          <MockInterviewStudio />

          {/* Educational Disclaimer Footer Note */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'var(--ifm-card-background-color, #ffffff)',
              border: '1px solid var(--ifm-color-emphasis-300, #98A2B3)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary, #64748b)', lineHeight: 1.6 }}>
              ⚖️ <strong>Tuyên bố miễn trừ trách nhiệm (Educational Disclaimer):</strong> Mọi nội dung, câu hỏi, định dạng và đánh giá trong phòng phỏng vấn thử đều mang tính chất học tập & tham khảo, không đại diện hoặc phản ánh chính xác 100% quy trình tuyển dụng thực tế của bất kỳ doanh nghiệp nào.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
