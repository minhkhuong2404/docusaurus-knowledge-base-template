import React, { useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

interface Props {
  children: React.ReactNode;
}

export default function PremiumWall({ children }: Props): JSX.Element {
  return (
    <BrowserOnly fallback={<div>Checking secure access credentials...</div>}>
      {() => {
        const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

        useEffect(() => {
          // When the SPA Router dynamically loads this MDX file, 
          // we force an API check to the Cloudflare Worker to verify the cookie.
          fetch('/api/me')
            .then(res => res.json())
            .then(data => {
              if (data.loggedIn) {
                setIsAuthed(true);
              } else {
                setIsAuthed(false);
              }
            })
            .catch(() => setIsAuthed(false));
        }, []);

        if (isAuthed === null) {
          return (
            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--ifm-color-emphasis-300)', borderRadius: '8px' }}>
              <p>🔐 Verifying Premium Session...</p>
            </div>
          );
        }

        if (isAuthed === false) {
          // Unauthorized! The SPA router allowed the page to load, but we violently intercept it.
          // We trigger a HARD reload to the login page to fully clear the SPA state.
          window.location.href = `/login?returnTo=${window.location.pathname}`;
          return (
             <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--ifm-color-danger)', borderRadius: '8px', color: 'var(--ifm-color-danger)' }}>
              <p>Unauthorized Access. Redirecting to login wall...</p>
            </div>
          );
        }

        // They are strictly authenticated via the Cloudflare KV check! Render the full Markdown block.
        return <div className="premium-locked-content">{children}</div>;
      }}
    </BrowserOnly>
  );
}
