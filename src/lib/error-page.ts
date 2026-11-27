export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="hi">
  <head>
    <meta charset="utf-8" />
    <title>Arun Gopal Traders — पेज लोड नहीं हो सका</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #FAF8F5; color: #16201A; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: #fff; border: 1px solid #E4DFD5; border-radius: 1.25rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #145A45; }
      p { color: #4B5563; margin: 0 0 1.5rem; font-size: 0.9rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.55rem 1.1rem; border-radius: 0.65rem; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #145A45; color: #fff; }
      .secondary { background: #fff; color: #145A45; border-color: #D1D5DB; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>अरुण गोपाल ट्रेडर्स • पेज लोड नहीं हुआ</h1>
      <p>सर्वर या नेटवर्क में अस्थायी समस्या आई है। कृपया पेज रिफ्रेश करें या मुख्य स्टोर पर वापस जाएं।</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">पुनः प्रयास करें (Retry)</button>
        <a class="secondary" href="/">मुख्य पृष्ठ (Home)</a>
      </div>
    </div>
  </body>
</html>`;
}
