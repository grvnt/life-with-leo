const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const password = process.env.SITE_PASSWORD;
  
  console.log('Event path:', event.path);
  console.log('Current directory:', __dirname);
  
  // Check if user is authenticated
  const isAuthenticated = event.headers.cookie && event.headers.cookie.includes('nf_jwt=authenticated');

  if (isAuthenticated) {
    // Serve the requested page from the Quartz build
    let filePath = path.join(__dirname, '..', '..', 'public', event.path.replace('/.netlify/functions/auth', ''));
    
    console.log('Attempting to serve file:', filePath);
    
    // If the path is empty or ends with '/', append 'index.html'
    if (filePath.endsWith('/') || path.basename(filePath) === 'public') {
      filePath = path.join(filePath, 'index.html');
    }
    // If the file doesn't exist, try adding '.html' extension
    else if (!path.extname(filePath)) {
      filePath += '.html';
    }

    try {
      const content = await fs.readFile(filePath);
      const contentType = getContentType(filePath);
      console.log('Successfully read file:', filePath);
      return {
        statusCode: 200,
        headers: { 'Content-Type': contentType },
        body: contentType.startsWith('text/') ? content.toString() : content.toString('base64'),
        isBase64Encoded: !contentType.startsWith('text/')
      };
    } catch (error) {
      console.error('Error reading file:', error);
      // If file not found, return 404
      return {
        statusCode: 404,
        body: `Page not found. Attempted to serve: ${filePath}`,
      };
    }
  } else if (event.httpMethod === 'POST') {
    // Handle password submission
    const params = new URLSearchParams(event.body);
    const receivedPassword = params.get('password');
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
                  body: new URLSearchParams({password}),
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
  }
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };
  return types[ext] || 'application/octet-stream';
}
