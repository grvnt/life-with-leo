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
        </head>
        <body>
          <h1>This site is password protected</h1>
          <form id="login-form">
            <input type="password" id="password" required>
            <button type="submit">Submit</button>
          </form>
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
                window.location.reload();
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

