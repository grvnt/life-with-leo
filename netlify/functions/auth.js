const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const password = process.env.SITE_PASSWORD;
  
  // Check if user is authenticated
  const isAuthenticated = event.headers.cookie && event.headers.cookie.includes('nf_jwt=authenticated');

  if (isAuthenticated) {
    // Serve the requested page from the Quartz build
    let filePath = path.join(__dirname, '..', '..', 'public', event.path);
    
    // If the path ends with '/', append 'index.html'
    if (event.path.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }
    // If the file doesn't exist, try adding '.html' extension
    else if (!filePath.endsWith('.html')) {
      filePath += '.html';
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: content,
      };
    } catch (error) {
      // If file not found, return 404
      return {
        statusCode: 404,
        body: 'Page not found',
      };
    }
  } else if (event.httpMethod === 'POST') {
    // Handle password submission
    const receivedPassword = decodeURIComponent(event.body.split('=')[1]);
    console.log('Received password:', receivedPassword);
    console.log('Expected password:', password);
    if (receivedPassword === password) {
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': 'nf_jwt=authenticated; Path=/; HttpOnly; Secure; SameSite=Strict',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: 'Incorrect password' }),
      };
    }
  } else {
    // Show login page
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login</title>
            <style>
              /* Your CSS styles here */
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Please enter the password</h1>
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
  }
};
