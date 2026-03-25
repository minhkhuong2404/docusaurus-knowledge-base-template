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

    // ============================================
    // 1. Handle Login API Route (/api/login)
    // ============================================
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const body = await request.json();

        // Hardcoded password demo (In production, optionally check Firebase/Auth0 here)
        if (body.password === "password123") {
          // Generate a secure UUID session token
          const sessionToken = crypto.randomUUID();
          const maxAge = 60 * 60 * 24 * 7; // 7 Days

          // Store in Cloudflare KV (You must bind your KV Namespace to env.SESSIONS_KV in the dashboard Worker settings)
          await env.SESSIONS_KV.put(sessionToken, "authenticated", { expirationTtl: maxAge });

          // Issue strictly secure HTTP-only cookie
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
    // 2. Handle Premium Content Interception (/docs/premium/*)
    // ============================================
    if (url.pathname.startsWith('/docs/premium/')) {
      const cookieHeader = request.headers.get("Cookie") || "";
      const cookies = Object.fromEntries(cookieHeader.split("; ").map(c => {
        const parts = c.split("=");
        return [parts[0], parts[1]];
      }));
      
      const sessionToken = cookies["premium_session_token"];

      // If no token exists, or if token isn't actively valid inside KV database, hijack the request!
      if (!sessionToken || !(await env.SESSIONS_KV.get(sessionToken))) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("returnTo", url.pathname);
        return Response.redirect(loginUrl.toString(), 302);
      }
      
      // If token is perfectly valid, fall through to fetch() below to serve the Markdown HTML
    }

    // ============================================
    // 3. Passthrough to GitHub Pages
    // ============================================
    // Any other URL (e.g. /docs/java) or a successfully validated premium URL gets fetched natively 
    // from your underlying GitHub Pages infrastructure.
    return fetch(request);
  }
};
