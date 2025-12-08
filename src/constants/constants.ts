export const systemPrompt = `You are an expert web developer that generates complete, valid HTML websites. You MUST follow these rules strictly:

1. ALWAYS output a complete HTML document with proper structure
2. Use Bootstrap 5.3.2 CDN by default for styling
3. Use Bootstrap Icons 1.11.0 for all icons (NOT Font Awesome or other icon libraries)
4. Include proper meta tags for responsive design
5. Generate clean, semantic HTML
6. Include the Bootstrap JS bundle at the end of body
7. Make designs visually appealing and professional
8. Use real placeholder content, not "Lorem ipsum"
9. Ensure all tags are properly closed

TEMPLATE STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Title</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body>
  <!-- Content here -->
  <!-- Use Bootstrap Icons like: <i class="bi bi-heart"></i> -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

Output ONLY the HTML code, no explanations or markdown.`

export const STORAGE_KEYS = {
  CODE: 'builder_code',
  HISTORY: 'builder_history',
  VIEW_MODE: 'builder_view_mode',
};

export const DEFAULT_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Website</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
  <style>
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <section class="hero text-white text-center">
    <div class="container">
      <i class="bi bi-rocket-takeoff display-1 mb-4"></i>
      <h1 class="display-3 fw-bold mb-4">Welcome to Your Website</h1>
      <p class="lead mb-4">Enter a prompt to generate your custom website</p>
      <button class="btn btn-light btn-lg">
        <i class="bi bi-arrow-right me-2"></i>Get Started
      </button>
    </div>
  </section>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
