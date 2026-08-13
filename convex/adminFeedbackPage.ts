// HTML for the /admin/feedback page. Helper module only — no Convex functions
// are registered here.

export const ADMIN_FEEDBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match — Feedback</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FEFAF6; color: #4A4459; }
    .header { background: linear-gradient(135deg, #FA92A9 0%, #AAA0DD 100%); color: white; padding: 20px 24px; }
    .header-inner { max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { font-size: 14px; opacity: 0.9; margin-top: 4px; }
    .header a { color: white; font-size: 14px; font-weight: 600; text-decoration: none; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.5); border-radius: 10px; }
    .container { max-width: 1000px; margin: 0 auto; padding: 24px 16px 60px; }
    .auth-gate { max-width: 400px; margin: 80px auto; text-align: center; }
    .auth-gate h2 { font-size: 22px; margin-bottom: 8px; }
    .auth-gate p { color: #8B8497; margin-bottom: 20px; font-size: 14px; }
    .auth-gate input { width: 100%; padding: 12px 16px; border: 1px solid #E4DDE8; border-radius: 10px; font-size: 16px; margin-bottom: 12px; outline: none; }
    .auth-gate button { width: 100%; padding: 12px; background: #FA92A9; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .auth-gate .error { color: #DC2626; font-size: 14px; margin-top: 8px; display: none; }
    .count-line { font-size: 13px; color: #8B8497; margin-bottom: 12px; }
    .card { background: white; border: 1px solid #F0E9F0; border-radius: 14px; padding: 18px; margin-bottom: 12px; }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .who { font-weight: 600; font-size: 15px; }
    .who span { font-weight: 400; color: #8B8497; font-size: 13px; }
    .when { color: #B3ACBC; font-size: 12px; white-space: nowrap; }
    .stars { color: #F5B301; font-size: 14px; letter-spacing: 1px; margin-bottom: 8px; }
    .message { font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
    .meta { margin-top: 10px; font-size: 12px; color: #B3ACBC; }
    .empty, .loading { text-align: center; padding: 60px 20px; color: #8B8497; }
    .spinner { display: inline-block; width: 30px; height: 30px; border: 3px solid #F0E9F0; border-top-color: #FA92A9; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="auth-screen" class="auth-gate">
    <h2>Bump Match Feedback</h2>
    <p>Enter the admin key to continue.</p>
    <input type="password" id="key-input" placeholder="Admin key" onkeydown="if(event.key==='Enter')doAuth()" />
    <button onclick="doAuth()">Sign In</button>
    <p id="auth-error" class="error">Invalid admin key.</p>
  </div>

  <div id="app-screen" style="display:none;">
    <div class="header">
      <div class="header-inner">
        <div>
          <h1>In-app Feedback</h1>
          <p>Sent from the app, newest first</p>
        </div>
        <a id="nav-users" href="/admin/users">Users &rarr;</a>
      </div>
    </div>
    <div class="container">
      <div class="count-line" id="count-line"></div>
      <div id="content">
        <div class="loading"><div class="spinner"></div><p style="margin-top:12px;">Loading feedback...</p></div>
      </div>
    </div>
  </div>

  <script>
    var adminKey = '';

    (function () {
      var params = new URLSearchParams(window.location.search);
      var key = params.get('key') || sessionStorage.getItem('bm_admin_key') || '';
      if (key) { adminKey = key; load(true); }
    })();

    function doAuth() {
      adminKey = document.getElementById('key-input').value.trim();
      load(true);
    }

    function load(isAuthAttempt) {
      fetch('/admin/api/feedback?key=' + encodeURIComponent(adminKey))
        .then(function (res) {
          if (res.status === 401) {
            sessionStorage.removeItem('bm_admin_key');
            document.getElementById('auth-error').style.display = 'block';
            document.getElementById('auth-screen').style.display = 'block';
            document.getElementById('app-screen').style.display = 'none';
            return null;
          }
          return res.json();
        })
        .then(function (rows) {
          if (!rows) return;
          sessionStorage.setItem('bm_admin_key', adminKey);
          document.getElementById('nav-users').href = '/admin/users?key=' + encodeURIComponent(adminKey);
          document.getElementById('auth-screen').style.display = 'none';
          document.getElementById('app-screen').style.display = 'block';
          render(rows);
        })
        .catch(function () {
          if (isAuthAttempt) document.getElementById('auth-error').style.display = 'block';
        });
    }

    function render(rows) {
      document.getElementById('count-line').textContent =
        rows.length + (rows.length === 1 ? ' message' : ' messages');

      if (!rows.length) {
        document.getElementById('content').innerHTML =
          '<div class="empty"><h3>No feedback yet</h3><p style="margin-top:6px;">It will appear here as soon as someone sends some.</p></div>';
        return;
      }

      document.getElementById('content').innerHTML = rows.map(function (r) {
        var who = r.name || r.email || 'Anonymous';
        var sub = r.name && r.email ? ' &middot; ' + escapeHtml(r.email) : '';
        var stars = r.rating ? '<div class="stars">' + '\\u2605'.repeat(r.rating) + '\\u2606'.repeat(5 - r.rating) + '</div>' : '';
        var meta = [r.platform, r.appVersion ? 'v' + r.appVersion : ''].filter(Boolean).map(escapeHtml).join(' &middot; ');
        return '<div class="card">' +
          '<div class="card-top">' +
            '<div class="who">' + escapeHtml(who) + '<span>' + sub + '</span></div>' +
            '<div class="when">' + formatDate(r.createdAt) + '</div>' +
          '</div>' +
          stars +
          '<div class="message">' + escapeHtml(r.message) + '</div>' +
          (meta ? '<div class="meta">' + meta + '</div>' : '') +
        '</div>';
      }).join('');
    }

    function formatDate(ts) {
      return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(String(str == null ? '' : str)));
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
