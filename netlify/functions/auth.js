exports.handler = async (event, context) => {
  const password = process.env.SITE_PASSWORD;
  
  if (event.httpMethod === 'POST') {
    if (event.body === `password=${password}`) {
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': 'nf_jwt=authenticated; Path=/; HttpOnly; Secure; SameSite=Strict',
        },
        body: JSON.stringify({ success: true }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Password Protected</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
            .container { background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            input, button { margin: 10px 0; padding: 10px; width: 100%; box-sizing: border-box; }
            button { background-color: #007bff; color: white; border: none; cursor: pointer; }
            button:hover { background-color: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>This site is password protected</h1>
            <form id="login-form">
              <input type="password" id="password" required placeholder="Enter password">
              <button type="submit">Submit</button>
            </form>
          </div>
          <script>
            document.getElementById('login-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const password = document.getElementById('password').value;
              const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                body: 'password=' + encodeURIComponent(password),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              });
              if (response.ok) {
                window.location.href = '/';
              } else {
                alert('Incorrect password');
              }
            });
          </script>
        </body>
      </html>
    `,
  };
};
