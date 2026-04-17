const SUPABASE_URL = 'https://fznbkrpgfhfeahkdehps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bmJrcnBnZmhmZWFoa2RlaHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQwNzksImV4cCI6MjA5MTM0MDA3OX0.0jqRCvcWHAlqSAh0b8xhARjRI-8TepHmTJJU4i2Wy0o';
const APP_STORE_URL = 'https://apps.apple.com/ca/app/findmyrun/id6762062692';

export default async function handler(req, res) {
    const { id } = req.query;
    const anonKey = SUPABASE_ANON_KEY;

    try {
        console.log('Fetching run id:', id, '| key present:', !!anonKey);

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(id)}&select=*,clubs(*),routes(*)&limit=1`,
            {
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                }
            }
        );

        const rawText = await response.text();
        console.log(`Supabase status: ${response.status}, body: ${rawText.substring(0, 300)}`);

        if (!response.ok) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(500).send(errorPage());
        }

        const runs = JSON.parse(rawText);
        const run = runs?.[0];

        res.setHeader('Content-Type', 'text/html; charset=utf-8');

        if (!run) {
            return res.status(404).send(notFoundPage());
        }

        res.status(200).send(runPage(run));
    } catch (err) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(500).send(errorPage());
    }
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-CA', { weekday: 'long' });
    const dateFormatted = date.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { dayName, dateFormatted, time };
}

function runPage(run) {
    const title = escHtml(run.title || 'Group Run');
    const clubName = escHtml(run.clubs?.name || '');
    const { dayName, dateFormatted, time } = formatDateTime(run.occurs_at);
    const address = escHtml(run.address || run.clubs?.city || '');
    const distanceM = run.routes?.distance_meters;
    const elevationM = run.routes?.elevation_gain_meters;
    const distance = distanceM ? `${(distanceM / 1000).toFixed(1)} km` : null;
    const elevation = elevationM ? `${Math.round(elevationM)} m` : null;
    const description = run.description ? escHtml(run.description) : null;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>${title} — FindMyRun</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${clubName} · ${dateFormatted} at ${time}${distance ? ' · ' + distance : ''}">
  <meta property="og:site_name" content="FindMyRun">
  <meta name="apple-itunes-app" content="app-id=6762062692">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f2f2f7;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px 40px;
    }
    .app-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .app-icon {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      display: block;
      margin: 0 auto 10px;
      overflow: hidden;
    }
    .app-name {
      font-size: 20px;
      font-weight: 700;
      color: #1c1c1e;
      letter-spacing: -0.3px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .weekday {
      display: inline-block;
      background: #1c1c1e;
      color: white;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 10px;
    }
    .run-title {
      font-size: 21px;
      font-weight: 700;
      color: #1c1c1e;
      letter-spacing: -0.3px;
      margin-bottom: 3px;
    }
    .club-name {
      font-size: 15px;
      color: #8e8e93;
      margin-bottom: 14px;
    }
    .divider { height: 1px; background: #f2f2f7; margin: 12px 0; }
    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 4px 0;
    }
    .detail-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; margin-top: 1px; }
    .detail-text { font-size: 15px; color: #3a3a3c; line-height: 1.4; }
    .stats-row { display: flex; gap: 10px; margin-top: 12px; }
    .stat {
      flex: 1;
      background: #f2f2f7;
      border-radius: 12px;
      padding: 10px 12px;
      text-align: center;
    }
    .stat-value { font-size: 17px; font-weight: 700; color: #1c1c1e; }
    .stat-label { font-size: 11px; color: #8e8e93; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
    .description {
      font-size: 14px;
      color: #636366;
      line-height: 1.5;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f2f2f7;
    }
    .cta-section { width: 100%; max-width: 400px; text-align: center; }
    .btn-download {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #1c1c1e;
      color: white;
      text-decoration: none;
      border-radius: 14px;
      padding: 16px;
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .tagline { font-size: 13px; color: #aeaeb2; }
  </style>
</head>
<body>
  <div class="app-header">
    <img class="app-icon" src="/app-icon.png" alt="FindMyRun">
    <div class="app-name">FindMyRun</div>
  </div>

  <div class="card">
    <div class="weekday">${dayName}</div>
    <div class="run-title">${title}</div>
    <div class="club-name">${clubName}</div>
    <div class="divider"></div>
    <div class="detail-row">
      <span class="detail-icon">📅</span>
      <span class="detail-text">${dateFormatted} at ${time}</span>
    </div>
    ${address ? `<div class="detail-row">
      <span class="detail-icon">📍</span>
      <span class="detail-text">${address}</span>
    </div>` : ''}
    ${(distance || elevation) ? `<div class="stats-row">
      ${distance ? `<div class="stat"><div class="stat-value">${distance}</div><div class="stat-label">Distance</div></div>` : ''}
      ${elevation ? `<div class="stat"><div class="stat-value">${elevation}</div><div class="stat-label">Elevation</div></div>` : ''}
    </div>` : ''}
    ${description ? `<div class="description">${description}</div>` : ''}
  </div>

  <div class="cta-section">
    <a class="btn-download" href="${APP_STORE_URL}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      Download FindMyRun
    </a>
    <p class="tagline">Discover group runs near you</p>
  </div>
</body>
</html>`;
}

function notFoundPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Run Not Found — FindMyRun</title>
  <style>
    body { font-family: -apple-system, sans-serif; text-align: center; padding: 80px 24px; background: #f2f2f7; }
    h1 { font-size: 22px; font-weight: 700; color: #1c1c1e; margin-bottom: 8px; }
    p { color: #8e8e93; font-size: 15px; margin-bottom: 32px; }
    a { background: #1c1c1e; color: white; text-decoration: none; border-radius: 14px; padding: 14px 28px; font-size: 16px; font-weight: 600; display: inline-block; }
  </style>
</head>
<body>
  <h1>Run Not Found</h1>
  <p>This run may have already passed or been removed.</p>
  <a href="${APP_STORE_URL}">Get FindMyRun</a>
</body>
</html>`;
}

function errorPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Something went wrong — FindMyRun</title>
  <style>
    body { font-family: -apple-system, sans-serif; text-align: center; padding: 80px 24px; background: #f2f2f7; }
    h1 { font-size: 22px; font-weight: 700; color: #1c1c1e; margin-bottom: 8px; }
    p { color: #8e8e93; font-size: 15px; }
  </style>
</head>
<body>
  <h1>Something went wrong</h1>
  <p>Please try again later.</p>
</body>
</html>`;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
