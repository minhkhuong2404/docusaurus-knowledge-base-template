import React from 'react';
import Layout from '@theme/Layout';
import LeaderboardView from '../../components/leaderboard/LeaderboardView';

export default function LeaderboardPage(): React.JSX.Element {
  return (
    <Layout
      title="Global Leaderboard & Architect Rankings"
      description="Live engineering rankings and peer activity across weekly, monthly, and all-time timeframes"
    >
      <div
        className="leaderboard-page-container"
        style={{
          minHeight: '100vh',
          background: 'var(--page-bg, #090d16)',
          padding: '36px 16px 80px 16px',
          color: 'var(--ifm-color-content, #ffffff)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <LeaderboardView initialTimeframe="alltime" />
        </div>
      </div>
    </Layout>
  );
}
