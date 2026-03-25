import React, { useEffect } from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // This executes purely on the client side every time Docusaurus initializes
    if (typeof window !== 'undefined') {
      fetch('/api/me')
        .then(res => res.json())
        .then(data => {
          // If the Cloudflare Worker confirms a valid KV session:
          if (data.loggedIn) {
            // Apply a global HTML class that CSS uses to instantly change the Navbar button!
            document.documentElement.classList.add('user-logged-in');
          } else {
            document.documentElement.classList.remove('user-logged-in');
          }
        })
        .catch(() => {
          document.documentElement.classList.remove('user-logged-in');
        });
    }
  }, []);

  return <>{children}</>;
}
