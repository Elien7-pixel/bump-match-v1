// HTML for the /admin/users dashboard. Helper module only — no Convex
// functions are registered here.

import { HIDDEN_EMAILS } from "./adminHiddenUsers";

export const ADMIN_USERS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match — Users</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FEFAF6; color: #4A4459; }
    .header { background: linear-gradient(135deg, #FA92A9 0%, #AAA0DD 100%); color: white; padding: 20px 24px; }
    .header-inner { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { font-size: 14px; opacity: 0.9; margin-top: 4px; }
    .header a { color: white; font-size: 14px; font-weight: 600; text-decoration: none; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.5); border-radius: 10px; }
    .header a:hover { background: rgba(255,255,255,0.18); }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px 16px 60px; }
    .auth-gate { max-width: 400px; margin: 80px auto; text-align: center; }
    .auth-gate h2 { font-size: 22px; margin-bottom: 8px; }
    .auth-gate p { color: #8B8497; margin-bottom: 20px; font-size: 14px; }
    .auth-gate input { width: 100%; padding: 12px 16px; border: 1px solid #E4DDE8; border-radius: 10px; font-size: 16px; margin-bottom: 12px; outline: none; }
    .auth-gate input:focus { border-color: #FA92A9; box-shadow: 0 0 0 3px rgba(250,146,169,0.2); }
    .auth-gate button { width: 100%; padding: 12px; background: #FA92A9; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .auth-gate button:hover { background: #e97e96; }
    .auth-gate .error { color: #DC2626; font-size: 14px; margin-top: 8px; display: none; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: white; border-radius: 14px; padding: 16px; text-align: center; border: 1px solid #F0E9F0; }
    .stat-card .num { font-size: 26px; font-weight: 700; color: #FA92A9; }
    .stat-card .label { font-size: 12px; color: #8B8497; margin-top: 4px; }
    .toolbar { background: white; border: 1px solid #F0E9F0; border-radius: 14px; padding: 14px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .toolbar input[type=search], .toolbar select { padding: 9px 12px; border: 1px solid #E4DDE8; border-radius: 9px; font-size: 14px; color: #4A4459; background: white; outline: none; }
    .toolbar input[type=search] { flex: 1 1 220px; min-width: 180px; }
    .toolbar input[type=search]:focus, .toolbar select:focus { border-color: #FA92A9; }
    .toolbar .spacer { flex: 1; }
    .btn { padding: 9px 16px; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary { background: #FA92A9; color: white; }
    .btn-primary:hover { background: #e97e96; }
    .btn-ghost { background: white; color: #4A4459; border: 1px solid #E4DDE8; }
    .btn-ghost:hover { border-color: #AAA0DD; color: #7A6FB0; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .count-line { font-size: 13px; color: #8B8497; margin-bottom: 10px; }
    .table-wrap { background: white; border: 1px solid #F0E9F0; border-radius: 14px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; white-space: nowrap; }
    th { position: sticky; top: 0; background: #FBF6FA; text-align: left; padding: 12px 14px; font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; color: #8B8497; border-bottom: 1px solid #F0E9F0; cursor: pointer; user-select: none; }
    th:hover { color: #FA92A9; }
    th .arrow { opacity: 0.5; font-size: 10px; }
    td { padding: 12px 14px; border-bottom: 1px solid #F7F2F6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #FFFBFD; }
    .pill { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .pill.mom { background: #FDE8ED; color: #C2506B; }
    .pill.dad { background: #E7F5F4; color: #2F7F7A; }
    .pill.partner { background: #EEEBF9; color: #6B5FB0; }
    .pill.boy { background: #E4F0FC; color: #1D4ED8; }
    .pill.girl { background: #FDE8ED; color: #BE185D; }
    .pill.unknown { background: #F3F0F5; color: #7A7286; }
    .pill.yes { background: #E3F6EC; color: #17694A; }
    .pill.no { background: #F3F0F5; color: #918A9C; }
    .muted { color: #B3ACBC; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    .empty, .loading { text-align: center; padding: 60px 20px; color: #8B8497; }
    .spinner { display: inline-block; width: 30px; height: 30px; border: 3px solid #F0E9F0; border-top-color: #FA92A9; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 600px) {
      .stats { grid-template-columns: 1fr 1fr; }
      .toolbar .spacer { display: none; }
      .btn, .toolbar select { flex: 1 1 auto; }
    }
  </style>
</head>
<body>
  <div id="auth-screen" class="auth-gate">
    <h2>Bump Match Users</h2>
    <p>Enter the admin key to continue.</p>
    <input type="password" id="key-input" placeholder="Admin key" onkeydown="if(event.key==='Enter')doAuth()" />
    <button onclick="doAuth()">Sign In</button>
    <p id="auth-error" class="error">Invalid admin key.</p>
  </div>

  <div id="app-screen" style="display:none;">
    <div class="header">
      <div class="header-inner">
        <div>
          <h1>Bump Match Users</h1>
          <p>Everything captured at registration</p>
        </div>
        <a id="nav-submissions" href="/admin">Name submissions &rarr;</a>
      </div>
    </div>
    <div class="container">
      <div class="stats" id="stats"></div>

      <div class="toolbar">
        <input type="search" id="search" placeholder="Search name, email or invite code" oninput="render()" />
        <select id="filter-gender" onchange="render()">
          <option value="">All roles</option>
          <option value="mom">Mum</option>
          <option value="dad">Dad</option>
          <option value="partner">Partner</option>
        </select>
        <select id="filter-expecting" onchange="render()">
          <option value="">All expecting</option>
          <option value="boy">Boy</option>
          <option value="girl">Girl</option>
          <option value="unknown">Don't know yet</option>
        </select>
        <select id="filter-paired" onchange="render()">
          <option value="">Paired &amp; solo</option>
          <option value="paired">Paired only</option>
          <option value="solo">Solo only</option>
        </select>
        <select id="filter-joined" onchange="render()">
          <option value="">Any time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <div class="spacer"></div>
        <button class="btn btn-ghost" onclick="loadUsers()">Refresh</button>
        <button class="btn btn-primary" id="export-btn" onclick="exportCsv()">Download CSV</button>
      </div>

      <div class="count-line" id="count-line"></div>
      <div id="content">
        <div class="loading"><div class="spinner"></div><p style="margin-top:12px;">Loading users...</p></div>
      </div>
    </div>
  </div>

  <script>
    var adminKey = '';
    var allUsers = [];
    var sortKey = 'registeredAt';
    var sortDir = 'desc';

    var COLUMNS = [
      { key: 'registeredAt', label: 'Registered' },
      { key: 'firstName', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'dateOfBirth', label: 'Date of birth' },
      { key: 'ageYears', label: 'Age' },
      { key: 'gender', label: 'Role' },
      { key: 'expecting', label: 'Expecting' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due date' },
      { key: 'country', label: 'Country' },
      { key: 'province', label: 'Province' },
      { key: 'heritage', label: 'Heritage' },
      { key: 'inviteCode', label: 'Invite code' },
      { key: 'partnerName', label: 'Partner' },
      { key: 'likedNames', label: 'Liked' },
      { key: 'favouriteNames', label: 'Favs' },
      { key: 'pushEnabled', label: 'Push' }
    ];

    // Accounts suppressed server-side by adminHiddenUsers.ts. Surfaced on the
    // count line so the totals are never silently short.
    var HIDDEN_COUNT = ${HIDDEN_EMAILS.size};

    var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    var GENDER_LABELS = { mom: 'Mum', dad: 'Dad', partner: 'Partner' };
    var EXPECTING_LABELS = { boy: 'Boy', girl: 'Girl', unknown: "Don't know" };

    (function () {
      var params = new URLSearchParams(window.location.search);
      var key = params.get('key') || sessionStorage.getItem('bm_admin_key') || '';
      if (key) {
        adminKey = key;
        loadUsers(true);
      }
    })();

    function doAuth() {
      adminKey = document.getElementById('key-input').value.trim();
      loadUsers(true);
    }

    function loadUsers(isAuthAttempt) {
      fetch('/admin/api/users?key=' + encodeURIComponent(adminKey))
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
        .then(function (data) {
          if (!data) return;
          allUsers = data;
          sessionStorage.setItem('bm_admin_key', adminKey);
          document.getElementById('nav-submissions').href = '/admin?key=' + encodeURIComponent(adminKey);
          document.getElementById('auth-screen').style.display = 'none';
          document.getElementById('app-screen').style.display = 'block';
          render();
        })
        .catch(function () {
          if (isAuthAttempt) document.getElementById('auth-error').style.display = 'block';
        });
    }

    // Due dates are captured as a month ("2027-03"); older accounts hold a full
    // day. Render each at the precision it was actually collected.
    function formatDueDate(value) {
      if (!value) return dash();
      var month = /^(\\d{4})-(\\d{2})$/.exec(value);
      if (month) return MONTH_NAMES[Number(month[2]) - 1] + ' ' + month[1];
      var full = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(value);
      if (full) return Number(full[3]) + ' ' + MONTH_NAMES[Number(full[2]) - 1] + ' ' + full[1];
      return escapeHtml(value);
    }

    function getFiltered() {
      var term = document.getElementById('search').value.trim().toLowerCase();
      var gender = document.getElementById('filter-gender').value;
      var expecting = document.getElementById('filter-expecting').value;
      var paired = document.getElementById('filter-paired').value;
      var joined = document.getElementById('filter-joined').value;
      var cutoff = joined ? Date.now() - Number(joined) * 86400000 : null;

      return allUsers.filter(function (u) {
        if (gender && u.gender !== gender) return false;
        if (expecting && u.expecting !== expecting) return false;
        if (paired === 'paired' && !u.isPaired) return false;
        if (paired === 'solo' && u.isPaired) return false;
        if (cutoff !== null && u.registeredAt < cutoff) return false;
        if (term) {
          var haystack = [u.firstName, u.surname, u.email, u.inviteCode, u.partnerName].join(' ').toLowerCase();
          if (haystack.indexOf(term) === -1) return false;
        }
        return true;
      });
    }

    function sortRows(rows) {
      var dir = sortDir === 'asc' ? 1 : -1;
      return rows.slice().sort(function (a, b) {
        var av = a[sortKey];
        var bv = b[sortKey];
        if (sortKey === 'firstName') {
          av = (a.firstName + ' ' + a.surname).toLowerCase();
          bv = (b.firstName + ' ' + b.surname).toLowerCase();
        }
        if (Array.isArray(av)) av = av.join(', ');
        if (Array.isArray(bv)) bv = bv.join(', ');
        if (av === null || av === undefined || av === '') return 1;
        if (bv === null || bv === undefined || bv === '') return -1;
        if (typeof av === 'string') return av.localeCompare(bv) * dir;
        return (av === bv ? 0 : av > bv ? 1 : -1) * dir;
      });
    }

    function setSort(key) {
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = key === 'registeredAt' ? 'desc' : 'asc';
      }
      render();
    }

    function render() {
      var now = Date.now();
      var week = allUsers.filter(function (u) { return u.registeredAt > now - 7 * 86400000; }).length;
      var month = allUsers.filter(function (u) { return u.registeredAt > now - 30 * 86400000; }).length;
      var pairedCount = allUsers.filter(function (u) { return u.isPaired; }).length;
      var pushCount = allUsers.filter(function (u) { return u.pushEnabled; }).length;

      document.getElementById('stats').innerHTML = [
        statCard(allUsers.length, 'Total users'),
        statCard(week, 'New this week'),
        statCard(month, 'New this month'),
        statCard(pairedCount, 'Paired'),
        statCard(allUsers.length - pairedCount, 'Solo'),
        statCard(pushCount, 'Push enabled')
      ].join('');

      var rows = sortRows(getFiltered());
      document.getElementById('count-line').textContent =
        'Showing ' + rows.length + ' of ' + allUsers.length + ' users' +
        (HIDDEN_COUNT ? ' · ' + HIDDEN_COUNT + ' internal accounts hidden' : '');
      document.getElementById('export-btn').disabled = rows.length === 0;

      if (rows.length === 0) {
        document.getElementById('content').innerHTML =
          '<div class="empty"><h3>No users match</h3><p style="margin-top:6px;">Try clearing the filters.</p></div>';
        return;
      }

      var head = COLUMNS.map(function (c) {
        var arrow = sortKey === c.key ? ' <span class="arrow">' + (sortDir === 'asc' ? '&uarr;' : '&darr;') + '</span>' : '';
        return '<th onclick="setSort(\\'' + c.key + '\\')">' + c.label + arrow + '</th>';
      }).join('');

      var body = rows.map(function (u) {
        return '<tr>' +
          '<td>' + formatDate(u.registeredAt) + '</td>' +
          '<td><strong>' + escapeHtml(u.firstName + ' ' + u.surname) + '</strong></td>' +
          '<td>' + escapeHtml(u.email) + '</td>' +
          '<td>' + orDash(u.dateOfBirth) + '</td>' +
          '<td>' + (u.ageYears === null ? dash() : u.ageYears) + '</td>' +
          '<td>' + pill(GENDER_LABELS[u.gender] || u.gender, u.gender) + '</td>' +
          '<td>' + (u.expecting ? pill(EXPECTING_LABELS[u.expecting] || u.expecting, u.expecting) : dash()) + '</td>' +
          '<td>' + orDash(u.status) + '</td>' +
          '<td>' + formatDueDate(u.dueDate) + '</td>' +
          '<td>' + orDash(u.country) + '</td>' +
          '<td>' + orDash(u.province) + '</td>' +
          '<td>' + orDash(u.heritage.join(', ')) + '</td>' +
          '<td class="mono">' + escapeHtml(u.inviteCode) + '</td>' +
          '<td>' + (u.isPaired ? escapeHtml(u.partnerName || u.partnerEmail) : '<span class="pill no">Solo</span>') + '</td>' +
          '<td>' + u.likedNames + '</td>' +
          '<td>' + u.favouriteNames + '</td>' +
          '<td>' + pill(u.pushEnabled ? 'Yes' : 'No', u.pushEnabled ? 'yes' : 'no') + '</td>' +
        '</tr>';
      }).join('');

      document.getElementById('content').innerHTML =
        '<div class="table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    function statCard(num, label) {
      return '<div class="stat-card"><div class="num">' + num + '</div><div class="label">' + label + '</div></div>';
    }

    function pill(text, cls) {
      return '<span class="pill ' + cls + '">' + escapeHtml(text) + '</span>';
    }

    function dash() {
      return '<span class="muted">&mdash;</span>';
    }

    function orDash(value) {
      return value ? escapeHtml(value) : dash();
    }

    function formatDate(ts) {
      return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str === null || str === undefined ? '' : String(str)));
      return div.innerHTML;
    }

    function exportCsv() {
      var btn = document.getElementById('export-btn');
      var ids = getFiltered().map(function (u) { return u.id; });
      btn.disabled = true;
      btn.textContent = 'Preparing...';

      fetch('/admin/api/users.csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey, ids: ids })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Export failed');
          var name = 'bump-match-users.csv';
          var disposition = res.headers.get('Content-Disposition') || '';
          var match = disposition.match(/filename="([^"]+)"/);
          if (match) name = match[1];
          return res.blob().then(function (blob) { return { blob: blob, name: name }; });
        })
        .then(function (result) {
          var url = URL.createObjectURL(result.blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = result.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        })
        .catch(function () {
          alert('Could not build the export. Please try again.');
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = 'Download CSV';
        });
    }
  </script>
</body>
</html>`;
