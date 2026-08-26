import React from 'react';
import Layout from '@theme/Layout';
import LeaderboardView from '../../components/leaderboard/LeaderboardView';

export default function LeaderboardPage(): React.JSX.Element {
  return (
    <Layout
      title="Global Leaderboard & Architect Rankings"
      description="Live engineering rankings and peer activity across weekly, monthly, and all-time timeframes"
    >
      <main style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
        <LeaderboardView initialTimeframe="alltime" />
      </main>
    </Layout>
  );
}
