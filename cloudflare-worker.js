/*
  CLOUDFLARE WORKER ROUTER (For GitHub Pages proxy)
  
  Since you host on GitHub Pages, Cloudflare Pages functions won't work automatically.
  Instead, you deploy this exact code as a standalone "Cloudflare Worker" in your Cloudflare Dashboard 
  and bind it to the route:  *luminhkhuong.dev/* 

  It will intercept all web traffic before it reaches GitHub Pages!
*/

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Helper: Parse the secure cookies
    const getCookies = (req) => {
      const cookieHeader = req.headers.get("Cookie") || "";
      return Object.fromEntries(cookieHeader.split("; ").map(c => {
        const parts = c.split("=");
        return [parts[0], parts[1]];
      }));
    };
    const getSessionToken = (req) => getCookies(req)["premium_session_token"];

    // ============================================
    // 1. Handle Login API (/api/login)
    // ============================================
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const body = await request.json();

        // Hardcoded password demo (In production, optionally check Firebase/Auth0 here)
        if (body.password === "password123") {
          const sessionToken = crypto.randomUUID();
          const maxAge = 60 * 60 * 24 * 7; // 7 Days

          await env.SESSIONS_KV.put(sessionToken, "authenticated", { expirationTtl: maxAge });

          const cookieString = `premium_session_token=${sessionToken}; HttpOnly; Secure; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": cookieString,
            },
          });
        }
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Bad Request" }), { status: 400 });
      }
    }

    // ============================================
    // 2. Handle Logout API (/api/logout)
    // ============================================
    if (url.pathname === '/api/logout' && request.method === 'POST') {
      const sessionToken = getSessionToken(request);

      // Invalidate token completely in KV database so it can never be reused
      if (sessionToken) {
        await env.SESSIONS_KV.delete(sessionToken);
      }

      // Delete the strictly secure cookie by setting Max-Age to 0
      const clearCookie = `premium_session_token=deleted; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax`;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Set-Cookie": clearCookie }
      });
    }

    // ============================================
    // 3. Handle Identity Verification API (/api/me)
    // ============================================
    // React Docusaurus calls this endpoint on page load to see if it should show "Logout" or "Login"
    if (url.pathname === '/api/me' && request.method === 'GET') {
      const sessionToken = getSessionToken(request);

      if (sessionToken) {
        const isValid = await env.SESSIONS_KV.get(sessionToken);
        if (isValid) {
          // The cookie is 100% valid and mathematically verified against KV!
          return new Response(JSON.stringify({ loggedIn: true, user: "Premium Member" }), {
            status: 200, headers: { "Content-Type": "application/json" }
          });
        }
      }
      return new Response(JSON.stringify({ loggedIn: false }), {
        status: 401, headers: { "Content-Type": "application/json" }
      });
    }

    // ============================================
    // 4. Handle Premium Content Interception (/docs/premium/*)
    // ============================================
    if (url.pathname.startsWith('/docs/premium/')) {
      const sessionToken = getSessionToken(request);

      // If no token exists, or if token isn't actively valid inside KV database, hijack the request!
      if (!sessionToken || !(await env.SESSIONS_KV.get(sessionToken))) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("returnTo", url.pathname);
        return Response.redirect(loginUrl.toString(), 302);
      }

      // If token is perfectly valid, fall through to fetch() below to serve the Markdown HTML
    }

    // ============================================
    // 5. Passthrough to GitHub Pages
    // ============================================
    // Any other URL (e.g. /docs/java) or a successfully validated premium URL gets fetched natively 
    // from your underlying GitHub Pages infrastructure.
    return fetch(request);
  }
};
