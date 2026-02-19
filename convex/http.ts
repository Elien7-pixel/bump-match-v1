import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Privacy Policy page
http.route({
  path: "/privacy-policy",
  method: "GET",
  handler: httpAction(async () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match - Privacy Policy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.7; background: #fafafa; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #111; }
    .date { color: #888; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 20px; margin-top: 32px; margin-bottom: 12px; color: #222; }
    p, li { font-size: 16px; color: #444; margin-bottom: 12px; }
    ul { padding-left: 24px; margin-bottom: 16px; }
    a { color: #C850C0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="date">Last updated: February 19, 2026</p>

    <p>Bump Match ("we", "our", or "us") operates the Bump Match mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our app.</p>

    <h2>1. Information We Collect</h2>
    <p>When you create an account, we collect:</p>
    <ul>
      <li><strong>Account information:</strong> first name, last name, email address, age, and password (stored as a hash).</li>
      <li><strong>Profile information:</strong> your role (mom, dad, or partner) and pregnancy/parenting status.</li>
      <li><strong>Usage data:</strong> baby names you like or skip within the app.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
      <li>Provide and maintain the app and your account.</li>
      <li>Allow you to connect with a partner and find matching baby name preferences.</li>
      <li>Send password reset emails when requested.</li>
      <li>Improve and personalize your experience.</li>
    </ul>

    <h2>3. Data Sharing</h2>
    <p>We do not sell, trade, or rent your personal information to third parties. We may share limited data with:</p>
    <ul>
      <li><strong>Your connected partner:</strong> liked baby names are shared between linked accounts to find matches.</li>
      <li><strong>Service providers:</strong> we use Convex (database hosting) and Resend (transactional email) to operate the app. These providers only process data on our behalf.</li>
    </ul>

    <h2>4. Data Storage & Security</h2>
    <p>Your data is stored securely on Convex cloud infrastructure. Passwords are hashed before storage. We use session tokens with expiration to manage authentication. While no method of electronic storage is 100% secure, we strive to use commercially acceptable means to protect your data.</p>

    <h2>5. Data Retention</h2>
    <p>We retain your personal data for as long as your account is active. You may request deletion of your account and all associated data at any time.</p>

    <h2>6. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access</strong> the personal data we hold about you.</li>
      <li><strong>Delete</strong> your account and all associated data via the <a href="/delete-account">account deletion page</a> or within the app settings.</li>
      <li><strong>Update</strong> your profile information within the app.</li>
    </ul>

    <h2>7. Children's Privacy</h2>
    <p>Our app is not intended for use by anyone under the age of 13. We do not knowingly collect personal information from children under 13.</p>

    <h2>8. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>

    <h2>9. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
    <p><strong>Email:</strong> ai@sherbetagency.com</p>
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

export default http;
