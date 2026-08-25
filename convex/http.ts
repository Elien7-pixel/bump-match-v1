import { httpRouter } from "convex/server";
import { PRIVACY_POLICY_HTML } from "./privacyPolicyHtml";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { ADMIN_USERS_HTML } from "./adminUsersPage";
import { buildUsersCsv, usersCsvFilename, AdminUserRow } from "./adminExport";
import { faqSectionsHtml } from "./faqContent";
import { ADMIN_FEEDBACK_HTML } from "./adminFeedbackPage";

// Override in production with `npx convex env set ADMIN_KEY <value>`.
const ADMIN_KEY = process.env.ADMIN_KEY || "bumpmatch-admin-2026";

const http = httpRouter();

// Privacy Policy page
http.route({
  path: "/privacy-policy",
  method: "GET",
  // Served from PRIVACY_POLICY.md via scripts/generate_privacy_html.js so the
  // public page cannot drift from the document again. It previously sat at
  // February 2026 while the policy had moved on, which meant the page the App
  // Store listing links to said nothing about advertising.
  handler: httpAction(async () => {
    return new Response(PRIVACY_POLICY_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// FAQ page. Same content as the support page's FAQ block — both render
// faqSectionsHtml() so an answer is only ever corrected in faqContent.ts.
http.route({
  path: "/faq",
  method: "GET",
  handler: httpAction(async () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match - FAQ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.7; background: #fafafa; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #111; }
    .subtitle { color: #888; font-size: 16px; margin-bottom: 32px; }
    h2 { font-size: 20px; margin-top: 32px; margin-bottom: 12px; color: #222; }
    p { font-size: 16px; color: #444; margin-bottom: 12px; }
    p strong { color: #222; }
    a { color: #C850C0; }
    .contact-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-top: 32px; }
    .contact-box h2 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Frequently Asked Questions</h1>
    <p class="subtitle">Everything people ask us most often about Bump Match.</p>

    ${faqSectionsHtml()}

    <div class="contact-box">
      <h2>Still stuck?</h2>
      <p>Send us feedback from the menu in the app, or email us:</p>
      <p><strong>Email:</strong> <a href="mailto:ai@sherbetagency.com">ai@sherbetagency.com</a></p>
      <p>See also our <a href="/support">support page</a>.</p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// Support page
http.route({
  path: "/support",
  method: "GET",
  handler: httpAction(async () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match - Support</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.7; background: #fafafa; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #111; }
    .subtitle { color: #888; font-size: 16px; margin-bottom: 32px; }
    h2 { font-size: 20px; margin-top: 32px; margin-bottom: 12px; color: #222; }
    p, li { font-size: 16px; color: #444; margin-bottom: 12px; }
    ul { padding-left: 24px; margin-bottom: 16px; }
    a { color: #C850C0; }
    .contact-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-top: 32px; }
    .contact-box h2 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Support</h1>
    <p class="subtitle">We're here to help you get the most out of Bump Match.</p>

    ${faqSectionsHtml()}

    <div class="contact-box">
      <h2>Contact Us</h2>
      <p>If you need further help or have feedback, reach out to us:</p>
      <p><strong>Email:</strong> <a href="mailto:ai@sherbetagency.com">ai@sherbetagency.com</a></p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// Delete Account page (GET - shows form)
http.route({
  path: "/delete-account",
  method: "GET",
  handler: httpAction(async () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match - Delete Account</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.7; background: #fafafa; }
    .container { max-width: 480px; margin: 0 auto; padding: 60px 24px; }
    h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
    p { font-size: 16px; color: #555; margin-bottom: 20px; }
    .warning { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .warning p { color: #991B1B; margin: 0; font-size: 14px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
    input { width: 100%; padding: 12px 16px; border: 1px solid #D1D5DB; border-radius: 10px; font-size: 16px; margin-bottom: 16px; outline: none; }
    input:focus { border-color: #C850C0; box-shadow: 0 0 0 3px rgba(200, 80, 192, 0.15); }
    button { width: 100%; padding: 14px; background: #DC2626; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; }
    button:hover { background: #B91C1C; }
    button:disabled { background: #9CA3AF; cursor: not-allowed; }
    .success { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 24px; text-align: center; }
    .success h2 { color: #166534; margin-bottom: 8px; }
    .success p { color: #15803D; margin: 0; }
    .error { color: #DC2626; font-size: 14px; margin-bottom: 16px; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div id="form-view">
      <h1>Delete Your Account</h1>
      <p>Enter your account credentials to permanently delete your Bump Match account and all associated data.</p>

      <div class="warning">
        <p><strong>Warning:</strong> This action is permanent and cannot be undone. All your data will be deleted, including your profile, liked names, partner connections, and session data.</p>
      </div>

      <form id="delete-form" onsubmit="handleDelete(event)">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" placeholder="your@email.com" required />

        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required />

        <p id="error-msg" class="error"></p>

        <button type="submit" id="submit-btn">Permanently Delete My Account</button>
      </form>
    </div>

    <div id="success-view" class="success" style="display: none;">
      <h2>Account Deleted</h2>
      <p>Your Bump Match account and all associated data have been permanently deleted. You can uninstall the app from your device.</p>
    </div>
  </div>

  <script>
    async function handleDelete(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      const errMsg = document.getElementById('error-msg');
      errMsg.style.display = 'none';

      if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;

      btn.disabled = true;
      btn.textContent = 'Deleting...';

      try {
        const res = await fetch('/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
          }),
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('form-view').style.display = 'none';
          document.getElementById('success-view').style.display = 'block';
        } else {
          errMsg.textContent = data.error || 'Failed to delete account.';
          errMsg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Permanently Delete My Account';
        }
      } catch (err) {
        errMsg.textContent = 'Something went wrong. Please try again.';
        errMsg.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Permanently Delete My Account';
      }
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// Delete Account handler (POST - processes deletion)
http.route({
  path: "/delete-account",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { email, password } = await request.json();

      if (!email || !password) {
        return new Response(JSON.stringify({ success: false, error: "Email and password are required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify credentials and delete account
      const result = await ctx.runMutation(api.deleteAccount.deleteAccount, {
        email,
        password,
      });

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 401,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || "Internal error." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ─── Deep Link / Join Route ───────────────────────────────────────────────────
http.route({
  path: "/join",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Redirect root /join to home
    return new Response(null, { status: 302, headers: { Location: "/" } });
  }),
});

// We need a catch-all-ish approach for /join/:code
// Convex doesn't support path params, so we use a prefix route
http.route({
  pathPrefix: "/join/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.pathname.replace("/join/", "").trim();

    const deepLink = `bumpmatch://join/${code}`;
    const iosStore = "https://apps.apple.com/app/bump-match/id6760332446";
    const playStore = "https://play.google.com/store/apps/details?id=com.orbitai.bumpmatch";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join on BumpMatch</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #C850C0 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: white; border-radius: 24px; padding: 48px 32px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .logo { font-size: 32px; font-weight: 800; margin-bottom: 8px; background: linear-gradient(135deg, #C850C0, #667eea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #888; font-size: 16px; margin-bottom: 32px; }
    .code-box { background: #F3F4F6; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .code-label { font-size: 13px; color: #888; margin-bottom: 4px; }
    .code { font-size: 24px; font-weight: 800; letter-spacing: 3px; color: #111; }
    .open-btn { display: block; width: 100%; padding: 16px; background: linear-gradient(135deg, #C850C0, #667eea); color: white; border: none; border-radius: 14px; font-size: 17px; font-weight: 700; cursor: pointer; margin-bottom: 16px; text-decoration: none; }
    .open-btn:hover { opacity: 0.9; }
    .store-links { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
    .store-link { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border: 1px solid #E5E7EB; border-radius: 10px; text-decoration: none; color: #333; font-size: 13px; font-weight: 600; }
    .store-link:hover { border-color: #C850C0; }
    .or-text { color: #ccc; font-size: 13px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">BumpMatch</div>
    <p class="subtitle">Someone invited you to find baby names together!</p>

    <div class="code-box">
      <div class="code-label">Partner Invite Code</div>
      <div class="code">${code || 'N/A'}</div>
    </div>

    <a href="${deepLink}" class="open-btn" id="open-app">Open in BumpMatch</a>

    <p class="or-text">Don't have the app yet?</p>

    <div class="store-links">
      <a href="${iosStore}" class="store-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        App Store
      </a>
      <a href="${playStore}" class="store-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.73c.45.38 1.05.5 1.6.27l13.07-7.19-3.31-3.31L3.18 23.73zM1.55 1.52C1.2 1.87 1 2.37 1 2.97v18.06c0 .6.2 1.1.55 1.45l.08.08L12.8 11.39 1.63 1.44l-.08.08zM21.85 10.24l-3.66-2.02-3.64 3.17 3.64 3.64 3.66-2.01c1.05-.58 1.05-2.2 0-2.78zM4.78.27L17.85 7.46l-3.31 3.31L1.63 1.44 4.78.27z"/></svg>
        Google Play
      </a>
    </div>
  </div>

  <script>
    // Try to open the app immediately
    setTimeout(function() {
      window.location.href = "${deepLink}";
    }, 100);
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

// GET /admin — serves the admin dashboard HTML
http.route({
  path: "/admin",
  method: "GET",
  handler: httpAction(async () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BumpMatch Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #333; }
    .header { background: linear-gradient(135deg, #C850C0 0%, #9B30FF 100%); color: white; padding: 20px 24px; box-shadow: 0 2px 8px rgba(200,80,192,0.3); }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { font-size: 14px; opacity: 0.85; margin-top: 4px; }
    .container { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
    .auth-gate { max-width: 400px; margin: 80px auto; text-align: center; }
    .auth-gate h2 { font-size: 22px; margin-bottom: 16px; color: #333; }
    .auth-gate input { width: 100%; padding: 12px 16px; border: 1px solid #D1D5DB; border-radius: 10px; font-size: 16px; margin-bottom: 12px; outline: none; }
    .auth-gate input:focus { border-color: #C850C0; box-shadow: 0 0 0 3px rgba(200,80,192,0.15); }
    .auth-gate button { width: 100%; padding: 12px; background: #C850C0; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .auth-gate button:hover { background: #a33f9e; }
    .auth-gate .error { color: #DC2626; font-size: 14px; margin-top: 8px; display: none; }
    .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .tab { padding: 10px 20px; border: 2px solid #E5E7EB; border-radius: 10px; background: white; cursor: pointer; font-size: 14px; font-weight: 600; color: #666; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .tab:hover { border-color: #C850C0; color: #C850C0; }
    .tab.active { background: #C850C0; color: white; border-color: #C850C0; }
    .tab .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; font-size: 12px; font-weight: 700; }
    .tab .badge { background: rgba(0,0,0,0.1); color: inherit; }
    .tab.active .badge { background: rgba(255,255,255,0.3); color: white; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-card .num { font-size: 28px; font-weight: 700; color: #C850C0; }
    .stat-card .label { font-size: 13px; color: #888; margin-top: 4px; }
    .cards { display: grid; gap: 16px; }
    .card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #f0f0f0; transition: box-shadow 0.2s; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .card-name { font-size: 20px; font-weight: 700; color: #111; }
    .card-gender { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-gender.boy { background: #DBEAFE; color: #1D4ED8; }
    .card-gender.girl { background: #FCE7F3; color: #BE185D; }
    .card-gender.unisex { background: #F3E8FF; color: #7C3AED; }
    .card-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .card-detail { font-size: 13px; }
    .card-detail .label { color: #999; font-weight: 500; }
    .card-detail .value { color: #444; margin-top: 2px; }
    .card-meta { font-size: 12px; color: #aaa; margin-bottom: 12px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; }
    .card-actions { display: flex; gap: 10px; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; flex: 1; }
    .btn-approve { background: #10B981; color: white; }
    .btn-approve:hover { background: #059669; }
    .btn-reject { background: #EF4444; color: white; }
    .btn-reject:hover { background: #DC2626; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-badge.approved { background: #D1FAE5; color: #065F46; }
    .status-badge.rejected { background: #FEE2E2; color: #991B1B; }
    .empty { text-align: center; padding: 60px 20px; color: #999; }
    .empty h3 { font-size: 18px; margin-bottom: 8px; color: #666; }
    .loading { text-align: center; padding: 60px 20px; color: #999; }
    .loading .spinner { display: inline-block; width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #C850C0; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 600px) {
      .card-details { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr 1fr; }
      .tabs { gap: 6px; }
      .tab { padding: 8px 14px; font-size: 13px; }
    }
  </style>
</head>
<body>
  <div id="auth-screen" class="auth-gate">
    <h2>BumpMatch Admin</h2>
    <p style="color: #888; margin-bottom: 20px;">Enter the admin key to continue.</p>
    <input type="password" id="key-input" placeholder="Admin key" onkeydown="if(event.key==='Enter')doAuth()" />
    <button onclick="doAuth()">Sign In</button>
    <p id="auth-error" class="error">Invalid admin key.</p>
  </div>

  <div id="app-screen" style="display:none;">
    <div class="header" style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
      <div>
        <h1>BumpMatch Admin</h1>
        <p>Name Submission Moderation Dashboard</p>
      </div>
      <a id="nav-users" href="/admin/users" style="color:white; font-size:14px; font-weight:600; text-decoration:none; padding:8px 14px; border:1px solid rgba(255,255,255,0.5); border-radius:10px;">Users &amp; exports &rarr;</a>
    </div>
    <div class="container">
      <div class="stats" id="stats"></div>
      <div class="tabs" id="tabs"></div>
      <div id="content">
        <div class="loading"><div class="spinner"></div><p style="margin-top:12px;">Loading submissions...</p></div>
      </div>
    </div>
  </div>

  <script>
    let adminKey = '';
    let allSubmissions = [];
    let activeTab = 'pending';

    // Check URL param on load
    (function() {
      const params = new URLSearchParams(window.location.search);
      const key = params.get('key');
      if (key) {
        adminKey = key;
        tryAuth();
      }
    })();

    function doAuth() {
      adminKey = document.getElementById('key-input').value.trim();
      tryAuth();
    }

    async function tryAuth() {
      try {
        const res = await fetch('/admin/api/submissions?key=' + encodeURIComponent(adminKey));
        if (res.status === 401) {
          document.getElementById('auth-error').style.display = 'block';
          return;
        }
        const data = await res.json();
        allSubmissions = data;
        document.getElementById('nav-users').href = '/admin/users?key=' + encodeURIComponent(adminKey);
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        render();
      } catch (e) {
        document.getElementById('auth-error').style.display = 'block';
      }
    }

    function render() {
      const pending = allSubmissions.filter(s => s.status === 'pending');
      const approved = allSubmissions.filter(s => s.status === 'approved');
      const rejected = allSubmissions.filter(s => s.status === 'rejected');

      // Stats
      document.getElementById('stats').innerHTML =
        '<div class="stat-card"><div class="num">' + allSubmissions.length + '</div><div class="label">Total</div></div>' +
        '<div class="stat-card"><div class="num">' + pending.length + '</div><div class="label">Pending</div></div>' +
        '<div class="stat-card"><div class="num">' + approved.length + '</div><div class="label">Approved</div></div>' +
        '<div class="stat-card"><div class="num">' + rejected.length + '</div><div class="label">Rejected</div></div>';

      // Tabs
      const tabs = [
        { key: 'pending', label: 'Pending', count: pending.length },
        { key: 'approved', label: 'Approved', count: approved.length },
        { key: 'rejected', label: 'Rejected', count: rejected.length },
      ];
      document.getElementById('tabs').innerHTML = tabs.map(t =>
        '<div class="tab' + (activeTab === t.key ? ' active' : '') + '" onclick="switchTab(\\'' + t.key + '\\')">' +
        t.label + ' <span class="badge">' + t.count + '</span></div>'
      ).join('');

      // Cards
      let items;
      if (activeTab === 'pending') items = pending;
      else if (activeTab === 'approved') items = approved;
      else items = rejected;

      // Sort by newest first
      items.sort((a, b) => b.createdAt - a.createdAt);

      if (items.length === 0) {
        document.getElementById('content').innerHTML =
          '<div class="empty"><h3>No ' + activeTab + ' submissions</h3><p>Nothing to show here yet.</p></div>';
        return;
      }

      document.getElementById('content').innerHTML = '<div class="cards">' + items.map(s => {
        const date = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const reviewDate = s.reviewedAt ? new Date(s.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        return '<div class="card" id="card-' + s.id + '">' +
          '<div class="card-header">' +
            '<span class="card-name">' + escapeHtml(s.name) + '</span>' +
            '<span class="card-gender ' + s.gender + '">' + s.gender + '</span>' +
          '</div>' +
          '<div class="card-details">' +
            '<div class="card-detail"><div class="label">Origin</div><div class="value">' + escapeHtml(s.origin) + '</div></div>' +
            '<div class="card-detail"><div class="label">Meaning</div><div class="value">' + escapeHtml(s.meaning) + '</div></div>' +
            '<div class="card-detail"><div class="label">Language</div><div class="value">' + escapeHtml(s.language) + '</div></div>' +
            '<div class="card-detail"><div class="label">Submitted by</div><div class="value">' + escapeHtml(s.submitterName) + '</div></div>' +
          '</div>' +
          '<div class="card-meta">' +
            '<span>Submitted: ' + date + '</span>' +
            (reviewDate ? '<span>Reviewed: ' + reviewDate + '</span>' : '') +
          '</div>' +
          (s.status === 'pending' ?
            '<div class="card-actions">' +
              '<button class="btn btn-approve" onclick="reviewAction(\\'' + s.id + '\\', \\'approve\\')">Approve</button>' +
              '<button class="btn btn-reject" onclick="reviewAction(\\'' + s.id + '\\', \\'reject\\')">Reject</button>' +
            '</div>'
          : '<span class="status-badge ' + s.status + '">' + s.status + '</span>') +
        '</div>';
      }).join('') + '</div>';
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function switchTab(tab) {
      activeTab = tab;
      render();
    }

    async function reviewAction(id, action) {
      const card = document.getElementById('card-' + id);
      const buttons = card ? card.querySelectorAll('button') : [];
      buttons.forEach(b => b.disabled = true);

      try {
        const res = await fetch('/admin/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: adminKey, submissionId: id, action: action }),
        });
        const data = await res.json();
        if (data.success) {
          // Update local data
          const sub = allSubmissions.find(s => s.id === id);
          if (sub) {
            sub.status = action === 'approve' ? 'approved' : 'rejected';
            sub.reviewedAt = Date.now();
          }
          render();
        } else {
          alert('Error: ' + (data.error || 'Failed to review submission'));
          buttons.forEach(b => b.disabled = false);
        }
      } catch (e) {
        alert('Network error. Please try again.');
        buttons.forEach(b => b.disabled = false);
      }
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// GET /admin/api/submissions — returns submissions as JSON
http.route({
  path: "/admin/api/submissions",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const status = url.searchParams.get("status") as "pending" | "approved" | "rejected" | null;

    const submissions = await ctx.runQuery(api.submissions.getAllSubmissions, {
      status: status || undefined,
    });

    return new Response(JSON.stringify(submissions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /admin/api/review — approve or reject a submission
http.route({
  path: "/admin/api/review",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { key, submissionId, action } = body;

      if (key !== ADMIN_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!submissionId || !action || !["approve", "reject"].includes(action)) {
        return new Response(JSON.stringify({ error: "Invalid request. Provide submissionId and action (approve/reject)." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await ctx.runMutation(api.submissions.reviewSubmission, {
        submissionId,
        action,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Internal error." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ─── Admin: Users & Exports ────────────────────────────────────────────────────

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /admin/feedback — serves the in-app feedback dashboard
http.route({
  path: "/admin/feedback",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(ADMIN_FEEDBACK_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// GET /admin/api/feedback — in-app feedback as JSON
http.route({
  path: "/admin/api/feedback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    if (url.searchParams.get("key") !== ADMIN_KEY) return unauthorized();

    const rows = await ctx.runQuery(internal.feedback.getAllFeedback, {});
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// GET /admin/users — serves the user dashboard HTML
http.route({
  path: "/admin/users",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(ADMIN_USERS_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

// GET /admin/api/users — every registered user as JSON
http.route({
  path: "/admin/api/users",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    if (url.searchParams.get("key") !== ADMIN_KEY) return unauthorized();

    const users = await ctx.runQuery(internal.adminUsers.getAllUsers, {});

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// GET /admin/api/users.csv — full export, handy for scripts and bookmarks
http.route({
  path: "/admin/api/users.csv",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    if (url.searchParams.get("key") !== ADMIN_KEY) return unauthorized();

    const users = await ctx.runQuery(internal.adminUsers.getAllUsers, {});
    return csvResponse(users);
  }),
});

// POST /admin/api/users.csv — export just the rows the dashboard is showing
http.route({
  path: "/admin/api/users.csv",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      if (body.key !== ADMIN_KEY) return unauthorized();

      const users = await ctx.runQuery(internal.adminUsers.getAllUsers, {});
      const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;
      const rows = ids ? users.filter((u) => ids.includes(u.id)) : users;

      return csvResponse(rows);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Internal error." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

function csvResponse(rows: AdminUserRow[]) {
  return new Response(buildUsersCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${usersCsvFilename(Date.now())}"`,
      "Cache-Control": "no-store",
    },
  });
}

export default http;
