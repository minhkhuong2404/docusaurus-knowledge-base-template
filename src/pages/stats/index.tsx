import React from 'react';
import { Redirect, useLocation } from '@docusaurus/router';

/**
 * Universal redirect forwarding legacy /stats routes and query params to the dedicated /profile page.
 */
export default function StatsRedirect(): React.JSX.Element {
  const location = useLocation();
  return <Redirect to={`/profile${location.search || ''}`} />;
}
